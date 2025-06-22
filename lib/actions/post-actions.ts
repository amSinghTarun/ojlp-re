"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const prisma = new PrismaClient()

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
    
    return { success: true, data: posts }
  } catch (error) {
    console.error("Failed to fetch posts:", error)
    return createErrorResponse("Failed to fetch posts")
  }
}

export async function getPost(slug: string) {
  try {
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

    return { success: true, data: post }
  } catch (error) {
    console.error(`Failed to fetch post ${slug}:`, error)
    return createErrorResponse("Failed to fetch post")
  }
}

export async function createPost(data: z.infer<typeof postSchema>) {
  try {
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
        type: validatedData.type,
        keywords: validatedData.keywords || [],
        doi: validatedData.doi || null,
        date: new Date(),
        readTime,
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

    console.log(`✅ Created post: ${post.title} with ${authors.length} author(s)`)
    
    revalidatePath("/admin/posts")
    revalidatePath("/blogs")
    if (validatedData.type === "journal") {
      revalidatePath("/journals")
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

    // Validate data if authors are provided
    let validatedData = data
    if (data.authors) {
      validatedData = postSchema.partial().parse(data)
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

    console.log(`✅ Updated post: ${post.title}`)
    
    revalidatePath("/admin/posts")
    revalidatePath(`/blogs/${slug}`)
    revalidatePath(`/blogs/${post.slug}`)
    if (post.type === "journal") {
      revalidatePath("/journals")
      revalidatePath(`/journals/${slug}`)
      revalidatePath(`/journals/${post.slug}`)
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
    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid post slug provided.")
    }

    const post = await prisma.article.findUnique({
      where: { slug }
    })

    if (!post) {
      return createErrorResponse("Post not found")
    }

    await prisma.article.delete({
      where: { slug }
    })

    console.log(`✅ Deleted post: ${post.title}`)
    
    revalidatePath("/admin/posts")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete post ${slug}:`, error)
    return createErrorResponse("Failed to delete post")
  }
}