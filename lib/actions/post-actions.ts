"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { z } from "zod"

const prisma = new PrismaClient()

// Helper function to get current user with permissions
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

// Author schema for validation
const authorSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
})

// Updated post schema with authors array (no images)
const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  type: z.enum(["blog", "journal"]).default("blog"),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
  featured: z.boolean().default(false),
  keywords: z.array(z.string()).optional(),
  doi: z.string().optional(),
  journalIssueId: z.string().optional().nullable(),
})

// Helper function to create error responses
function createErrorResponse(message: string, details?: string) {
  return { 
    success: false,
    error: details ? `${message} Details: ${details}` : message 
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Helper function to calculate read time (rough estimate)
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

/**
 * Find or create authors based on email addresses
 */
async function findOrCreateAuthors(authors: { name: string; email: string }[]) {
  const authorResults = []
  
  for (const authorData of authors) {
    // Check if author exists by email
    let author = await prisma.author.findUnique({
      where: { email: authorData.email.toLowerCase() }
    })
    
    if (!author) {
      // Create new author if doesn't exist
      author = await prisma.author.create({
        data: {
          name: authorData.name.trim(),
          email: authorData.email.toLowerCase().trim(),
          slug: authorData.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '-'),
        }
      })
      console.log(`✅ Created new author: ${author.name} (${author.email})`)
    } else {
      // Update author name if it has changed
      if (author.name !== authorData.name.trim()) {
        author = await prisma.author.update({
          where: { id: author.id },
          data: { name: authorData.name.trim() }
        })
        console.log(`📝 Updated author name: ${author.name}`)
      }
    }
    
    authorResults.push(author)
  }
  
  return authorResults
}

export async function getPosts(type?: "blog" | "journal") {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to read articles
    const permissionCheck = checkPermission(currentUser, 'article.READ')
    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to view posts"
      )
    }

    const posts = await prisma.article.findMany({
      where: type ? { type } : undefined,
      include: {
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        // categories: {
        //   include: {
        //     category: true
        //   }
        // },
        // journalIssue: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`✅ User ${currentUser.email} fetched ${posts.length} posts${type ? ` (type: ${type})` : ''}`)
    
    return { success: true, data: posts }
  } catch (error) {
    console.error("Failed to fetch posts:", error)
    return createErrorResponse("Failed to fetch posts")
  }
}

export async function getPost(slug: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to read articles
    const permissionCheck = checkPermission(currentUser, 'article.READ')
    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to view post details"
      )
    }

    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid post slug provided.")
    }

    const post = await prisma.article.findUnique({
      where: { slug },
      include: {
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
      }
    })

    if (!post) {
      return createErrorResponse("Post not found")
    }

    console.log(`✅ User ${currentUser.email} viewed post: ${post.title}`)

    return { success: true, data: post }
  } catch (error) {
    console.error(`Failed to fetch post ${slug}:`, error)
    return createErrorResponse("Failed to fetch post")
  }
}

export async function createPost(data: z.infer<typeof postSchema>) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to create articles
    const permissionCheck = checkPermission(currentUser, 'article.CREATE')
    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to create posts"
      )
    }

    const validatedData = postSchema.parse(data)
    
    // Generate slug from title
    const baseSlug = generateSlug(validatedData.title)
    let slug = baseSlug
    let counter = 1
    
    // Ensure slug is unique
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    // Check for duplicate DOI if provided
    if (validatedData.doi) {
      const existingDOI = await prisma.article.findUnique({
        where: { doi: validatedData.doi }
      })
      if (existingDOI) {
        return createErrorResponse("An article with this DOI already exists")
      }
    }
    
    // Find or create authors
    const authors = await findOrCreateAuthors(validatedData.authors)
    
    // Calculate read time
    const readTime = calculateReadTime(validatedData.content)
    
    // Create the post
    const post = await prisma.article.create({
      data: {
        title: validatedData.title,
        slug,
        content: validatedData.content,
        excerpt: validatedData.excerpt || validatedData.content.substring(0, 200) + "...",
        type: validatedData.type,
        keywords: validatedData.keywords || [],
        doi: validatedData.doi || null,
        // featured: validatedData.featured || false,
        // journalIssueId: validatedData.journalIssueId || null,
        date: new Date(),
        readTime,
        draft: false,
        authors: {
          create: authors.map((author, index) => ({
            authorId: author.id,
            authorOrder: index + 1
          }))
        }
      },
      include: {
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        }
      }
    })

    console.log(`✅ User ${currentUser.email} created post: ${post.title} with ${authors.length} author(s)`)
    
    revalidatePath("/admin/posts")
    revalidatePath("/blogs")
    if (validatedData.type === "journal") {
      revalidatePath("/journals")
      revalidatePath("/admin/journal-articles")
    }
    
    return { success: true, data: post }
  } catch (error) {
    console.error("Failed to create post:", error)
    if (error instanceof z.ZodError) {
      return createErrorResponse("Validation failed", error.errors.map(e => e.message).join(", "))
    }
    return createErrorResponse("Failed to create post")
  }
}

export async function updatePost(slug: string, data: Partial<z.infer<typeof postSchema>>) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid post slug provided.")
    }

    // Find the existing post to check ownership
    const existingPost = await prisma.article.findUnique({
      where: { slug },
      include: {
        authors: {
          include: {
            author: true
          }
        }
      }
    })

    if (!existingPost) {
      return createErrorResponse("Post not found")
    }

    // Check if user has permission to update articles
    const isOwner = existingPost.authors.some(aa => aa.author.userId === currentUser.id)
    
    const permissionCheck = checkPermission(currentUser, 'article.UPDATE')

    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to update this post"
      )
    }

    // Validate data if authors are provided
    let validatedData = data
    if (data.authors) {
      validatedData = postSchema.partial().parse(data)
    }

    // Check for duplicate DOI if being updated
    if (validatedData.doi && validatedData.doi !== existingPost.doi) {
      const existingDOI = await prisma.article.findUnique({
        where: { doi: validatedData.doi }
      })
      if (existingDOI) {
        return createErrorResponse("An article with this DOI already exists")
      }
    }

    // Handle authors if provided
    let authorsToConnect: any[] = []
    if (validatedData.authors) {
      const authors = await findOrCreateAuthors(validatedData.authors)
      authorsToConnect = authors.map((author, index) => ({
        authorId: author.id,
        authorOrder: index + 1
      }))
    }

    // Calculate read time if content is updated
    let readTime = existingPost.readTime
    if (validatedData.content) {
      readTime = calculateReadTime(validatedData.content)
    }

    // Update the post
    const post = await prisma.article.update({
      where: { slug },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content && { content: validatedData.content, readTime }),
        ...(validatedData.excerpt !== undefined && { excerpt: validatedData.excerpt }),
        ...(validatedData.type && { type: validatedData.type }),
        ...(validatedData.featured !== undefined && { featured: validatedData.featured }),
        ...(validatedData.keywords !== undefined && { keywords: validatedData.keywords }),
        ...(validatedData.doi !== undefined && { doi: validatedData.doi }),
        ...(validatedData.journalIssueId !== undefined && { journalIssueId: validatedData.journalIssueId }),
        ...(authorsToConnect.length > 0 && {
          authors: {
            deleteMany: {}, // Remove existing author connections
            create: authorsToConnect // Add new author connections
          }
        })
      },
      include: {
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        }
      }
    })

    console.log(`✅ User ${currentUser.email} updated post: ${post.title}`)
    
    revalidatePath("/admin/posts")
    revalidatePath(`/blogs/${slug}`)
    revalidatePath(`/blogs/${post.slug}`)
    if (post.type === "journal") {
      revalidatePath("/journals")
      revalidatePath(`/journals/${slug}`)
      revalidatePath(`/journals/${post.slug}`)
      revalidatePath("/admin/journal-articles")
    }
    
    return { success: true, data: post }
  } catch (error) {
    console.error(`Failed to update post ${slug}:`, error)
    if (error instanceof z.ZodError) {
      return createErrorResponse("Validation failed", error.errors.map(e => e.message).join(", "))
    }
    return createErrorResponse("Failed to update post")
  }
}

export async function deletePost(slug: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid post slug provided.")
    }

    // Find the existing post to check ownership
    const existingPost = await prisma.article.findUnique({
      where: { slug },
      include: {
        authors: {
          include: {
            author: true
          }
        }
      }
    })

    if (!existingPost) {
      return createErrorResponse("Post not found")
    }

    // Check if user has permission to delete articles
    const isOwner = existingPost.authors.some(aa => aa.author.userId === currentUser.id)
    
    const permissionCheck = checkPermission(currentUser, 'article.DELETE')

    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to delete this post"
      )
    }

    await prisma.article.delete({
      where: { slug }
    })

    console.log(`✅ User ${currentUser.email} deleted post: ${existingPost.title}`)
    
    revalidatePath("/admin/posts")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    if (existingPost.type === "journal") {
      revalidatePath("/admin/journal-articles")
    }
    
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete post ${slug}:`, error)
    return createErrorResponse("Failed to delete post")
  }
}

// NEW: Function to get posts with permission context
export async function getPostsWithPermissions(type?: "blog" | "journal") {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to read articles
    const permissionCheck = checkPermission(currentUser, 'article.READ')
    if (!permissionCheck.allowed) {
      return createErrorResponse("You don't have permission to view posts")
    }

    const posts = await prisma.article.findMany({
      where: type ? { type } : undefined,
      include: {
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add permission context to each post
    const postsWithPermissions = posts.map(post => {
      const isOwner = post.authors.some(aa => aa.author.userId === currentUser.id)
      
      return {
        ...post,
        canEdit: checkPermission(currentUser, 'article.UPDATE').allowed,
        canDelete: checkPermission(currentUser, 'article.DELETE').allowed,
      }
    })

    return { 
      success: true, 
      data: postsWithPermissions,
      canCreate: checkPermission(currentUser, 'article.CREATE').allowed
    }
  } catch (error) {
    console.error("Failed to fetch posts with permissions:", error)
    return createErrorResponse("Failed to fetch posts")
  }
}

// NEW: Function to check post permissions
export async function checkPostPermissions(slug?: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { 
        success: false, 
        error: "Authentication required",
        permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
      }
    }

    let permissions = {
      canRead: checkPermission(currentUser, 'article.READ').allowed,
      canCreate: checkPermission(currentUser, 'article.CREATE').allowed,
      canUpdate: false,
      canDelete: false,
    }

    // If specific post slug is provided, check update/delete permissions
    if (slug) {
      const post = await prisma.article.findUnique({
        where: { slug },
        include: {
          authors: {
            include: { author: true }
          }
        }
      })

      if (post) {
        const isOwner = post.authors.some(aa => aa.author.userId === currentUser.id)
        
        permissions.canUpdate = checkPermission(currentUser, 'article.UPDATE').allowed

        permissions.canDelete = checkPermission(currentUser, 'article.DELETE').allowed
      }
    }

    return { success: true, permissions }
  } catch (error) {
    console.error("Failed to check post permissions:", error)
    return { 
      success: false, 
      error: "Failed to check permissions",
      permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
    }
  }
}

// NEW: Function to get user's own posts
export async function getMyPosts(type?: "blog" | "journal") {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to read articles
    const permissionCheck = checkPermission(currentUser, 'article.READ')
    if (!permissionCheck.allowed) {
      return createErrorResponse("You don't have permission to view posts")
    }

    // Find posts where current user is an author
    const posts = await prisma.article.findMany({
      where: {
        ...(type && { type }),
        authors: {
          some: {
            author: {
              userId: currentUser.id
            }
          }
        }
      },
      include: {
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ User ${currentUser.email} fetched ${posts.length} of their own posts${type ? ` (type: ${type})` : ''}`)

    return { success: true, data: posts }
  } catch (error) {
    console.error("Failed to fetch user's posts:", error)
    return createErrorResponse("Failed to fetch your posts")
  }
}