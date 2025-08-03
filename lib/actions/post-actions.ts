"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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

// Updated post schema to match the current Article model schema
const postSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  abstract: z.string().optional(),
  content: z.string()
    .min(1, "Content is required"),
  type: z.enum(["blog", "journal"]).default("blog"),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
  publishedAt: z.date({ required_error: "Publication date is required" }),
  readTime: z.number().optional(),
  image: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  contentLink: z.string().optional(),
  // Article-specific fields with correct schema mapping
  archived: z.boolean().default(false),
  featured: z.boolean().default(false),
  carousel: z.boolean().default(false),
  // Journal-specific fields
  issueId: z.string().optional(),
})

// Helper function to create error responses
function createErrorResponse(message: string, details?: string) {
  return { 
    success: false,
    error: details ? `${message} Details: ${details}` : message 
  }
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
      // Generate slug for new author
      const authorSlug = authorData.email.toLowerCase().replace(/[^a-z0-9]/g, '-')
      
      // Create new author if doesn't exist
      author = await prisma.author.create({
        data: {
          name: authorData.name.trim(),
          email: authorData.email.toLowerCase().trim(),
          slug: authorSlug,
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
      where: type ? { type } : {type: "blog"},
      include: {
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        JournalIssue: true
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
        JournalIssue: true
      }
    })

    if (!post) {
      return createErrorResponse("Post not found")
    }

    console.log(`✅ User ${currentUser.email} viewed post: ${post.title}`)

    // Transform data to match expected format
    const transformedPost = {
      ...post,
      Authors: post.authors.map(aa => aa.author),
      journalIssue: post.JournalIssue
    }

    return { success: true, data: transformedPost }
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

    console.log("📝 Creating post with data:", data)
    
    const validatedData = postSchema.parse(data)
    
    // Check if slug already exists
    if (await prisma.article.findUnique({ where: { slug: validatedData.slug } })) {
      return createErrorResponse("A post with this slug already exists. Please use a different slug.")
    }
    
    // Find or create authors
    const authors = await findOrCreateAuthors(validatedData.authors)
    
    // Use provided readTime or calculate from content
    const readTime = validatedData.readTime || calculateReadTime(validatedData.content)
    
    // Create the post using transaction for data consistency
    const post = await prisma.$transaction(async (tx) => {
      // Create the article
      const newPost = await tx.article.create({
        data: {
          title: validatedData.title,
          slug: validatedData.slug,
          abstract: validatedData.abstract,
          content: validatedData.content,
          type: validatedData.type,
          publishedAt: validatedData.publishedAt,
          readTime: readTime,
          image: validatedData.image || null,
          keywords: validatedData.keywords,
          contentLink: validatedData.contentLink || null,
          archived: validatedData.archived,
          featured: validatedData.featured,
          carousel: validatedData.carousel,
          issueId: validatedData.issueId || null,
          views: 0,
          downloadCount: 0,
        }
      })
      
      // Create author relationships
      for (let i = 0; i < authors.length; i++) {
        await tx.authorArticle.create({
          data: {
            authorId: authors[i].id,
            articleId: newPost.id,
            authorOrder: i + 1
          }
        })
      }
      
      return newPost
    })

    console.log(`✅ User ${currentUser.email} created post: ${post.title} with ${authors.length} author(s)`)
    
    // Revalidate relevant paths
    revalidatePath("/admin/posts")
    revalidatePath("/")
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
    return createErrorResponse("Failed to create post", error instanceof Error ? error.message : "Unknown error")
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

    console.log("📝 Updating post:", slug, "with data:", data)

    // Find the existing post
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

    // Check if user has permission to update articles
    const permissionCheck = checkPermission(currentUser, 'article.UPDATE')

    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to update this post"
      )
    }

    // Validate data
    const validatedData = postSchema.partial().parse(data)

    // Check for slug conflicts if slug is being changed
    if (validatedData.slug && validatedData.slug !== existingPost.slug) {
      const existingSlug = await prisma.article.findUnique({ 
        where: { slug: validatedData.slug } 
      })
      if (existingSlug) {
        return createErrorResponse("A post with this slug already exists. Please use a different slug.")
      }
    }

    // Handle authors if provided
    let authorsToUpdate: any[] = []
    if (validatedData.authors) {
      authorsToUpdate = await findOrCreateAuthors(validatedData.authors)
    }

    // Calculate read time if content is updated
    let readTime = existingPost.readTime
    if (validatedData.content) {
      readTime = validatedData.readTime || calculateReadTime(validatedData.content)
    } else if (validatedData.readTime) {
      readTime = validatedData.readTime
    }

    // Update the post using transaction
    const post = await prisma.$transaction(async (tx) => {
      // Update the article
      const updatedPost = await tx.article.update({
        where: { slug },
        data: {
          ...(validatedData.title !== undefined && { title: validatedData.title }),
          ...(validatedData.slug !== undefined && { slug: validatedData.slug }),
          ...(validatedData.abstract !== undefined && { abstract: validatedData.abstract }),
          ...(validatedData.content !== undefined && { content: validatedData.content }),
          ...(validatedData.type !== undefined && { type: validatedData.type }),
          ...(validatedData.publishedAt !== undefined && { publishedAt: validatedData.publishedAt }),
          ...(readTime !== undefined && { readTime: readTime }),
          ...(validatedData.image !== undefined && { image: validatedData.image || null }),
          ...(validatedData.keywords !== undefined && { keywords: validatedData.keywords }),
          ...(validatedData.contentLink !== undefined && { contentLink: validatedData.contentLink || null }),
          ...(validatedData.archived !== undefined && { archived: validatedData.archived }),
          ...(validatedData.featured !== undefined && { featured: validatedData.featured }),
          ...(validatedData.carousel !== undefined && { carousel: validatedData.carousel }),
          ...(validatedData.issueId !== undefined && { issueId: validatedData.issueId || null }),
        }
      })
      
      // Update authors if provided
      if (authorsToUpdate.length > 0) {
        // Delete existing author relationships
        await tx.authorArticle.deleteMany({
          where: { articleId: updatedPost.id }
        })
        
        // Create new author relationships
        for (let i = 0; i < authorsToUpdate.length; i++) {
          await tx.authorArticle.create({
            data: {
              authorId: authorsToUpdate[i].id,
              articleId: updatedPost.id,
              authorOrder: i + 1
            }
          })
        }
      }
      
      return updatedPost
    })

    console.log(`✅ User ${currentUser.email} updated post: ${post.title}`)
    
    // Revalidate paths
    const newSlug = validatedData.slug || slug
    revalidatePath("/admin/posts")
    revalidatePath("/")
    revalidatePath(`/blogs/${slug}`)
    revalidatePath(`/blogs/${newSlug}`)
    if (post.type === "journal") {
      revalidatePath("/journals")
      revalidatePath(`/journals/${slug}`)
      revalidatePath(`/journals/${newSlug}`)
      revalidatePath("/admin/journal-articles")
    }
    
    return { success: true, data: post }
  } catch (error) {
    console.error(`Failed to update post ${slug}:`, error)
    if (error instanceof z.ZodError) {
      return createErrorResponse("Validation failed", error.errors.map(e => e.message).join(", "))
    }
    return createErrorResponse("Failed to update post", error instanceof Error ? error.message : "Unknown error")
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

    // Find the existing post
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
    const permissionCheck = checkPermission(currentUser, 'article.DELETE')

    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to delete this post"
      )
    }

    // Delete the post (author relationships will be deleted automatically due to cascade)
    await prisma.article.delete({
      where: { slug }
    })

    console.log(`✅ User ${currentUser.email} deleted post: ${existingPost.title}`)
    
    revalidatePath("/admin/posts")
    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    if (existingPost.type === "journal") {
      revalidatePath("/admin/journal-articles")
    }
    
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete post ${slug}:`, error)
    return createErrorResponse("Failed to delete post", error instanceof Error ? error.message : "Unknown error")
  }
}

// Function to get posts with permission context
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
        JournalIssue: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add permission context to each post
    const postsWithPermissions = posts.map(post => {
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

// Function to check post permissions
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