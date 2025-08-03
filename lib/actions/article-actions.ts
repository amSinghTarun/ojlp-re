"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { prisma } from "@/lib/prisma"

// Helper function to get current user with permissions
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    // If user already has role and permissions, return as is
    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    // Otherwise fetch the complete user data with role and permissions
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true
      }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Helper function to calculate read time
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

// Helper function to find or create authors
async function findOrCreateAuthors(authorIds: string[]) {
  const authors = []
  for (const authorId of authorIds) {
    const author = await prisma.author.findUnique({
      where: { id: authorId }
    })
    if (author) {
      authors.push(author)
    }
  }
  return authors
}

export async function createArticle(data: {
  title: string
  content: string
  abstract?: string
  type: "blog" | "journal"
  image?: string
  authorIds: string[]
  categoryIds?: string[]
  featured?: boolean
  carousel?: boolean
  keywords?: string[]
  journalIssueId?: string
  readTime?: number
  contentLink?: string
}) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create articles
    const permissionCheck = checkPermission(currentUser, 'article.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to create articles" 
      }
    }

    // Generate slug from title
    const slug = generateSlug(data.title)
    
    // Check for duplicate slug
    const existingSlug = await prisma.article.findUnique({
      where: { slug }
    })
    if (existingSlug) {
      return { success: false, error: "An article with this title already exists" }
    }

    // Find authors
    const authors = await findOrCreateAuthors(data.authorIds)
    if (authors.length === 0) {
      return { success: false, error: "At least one valid author is required" }
    }

    // Calculate read time
    const readTime = data.readTime || calculateReadTime(data.content)

    // Create the article with authors in a transaction
    const article = await prisma.$transaction(async (tx) => {
      // Create the article
      const newArticle = await tx.article.create({
        data: {
          title: data.title,
          slug,
          abstract: data.abstract || data.content.substring(0, 200) + "...",
          content: data.content,
          type: data.type,
          image: data.image || null,
          readTime,
          publishedAt: new Date(),
          keywords: data.keywords || [],
          issueId: data.journalIssueId || null,
          featured: data.featured || false,
          carousel: data.carousel || false,
          contentLink: data.contentLink || null,
          archived: false, // Default to not archived
        }
      })

      // Create author-article relationships
      for (let i = 0; i < authors.length; i++) {
        await tx.authorArticle.create({
          data: {
            articleId: newArticle.id,
            authorId: authors[i].id,
            authorOrder: i + 1,
          }
        })
      }

      return newArticle
    })

    console.log(`✅ Article created successfully: ${article.title}`)

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath("/featured")
    revalidatePath(`/${data.type === "blog" ? "blogs" : "journals"}/${article.slug}`)
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article }
  } catch (error) {
    console.error("Error creating article:", error)
    return { success: false, error: "Failed to create article" }
  }
}

export async function updateArticle(
  slug: string,
  data: {
    title?: string
    content?: string
    abstract?: string
    image?: string
    authorIds?: string[]
    categoryIds?: string[]
    featured?: boolean
    carousel?: boolean
    keywords?: string[]
    journalIssueId?: string | null
    type?: "blog" | "journal"
    readTime?: number
    contentLink?: string
    archived?: boolean
  },
) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Get the existing article to check ownership if needed
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      include: {
        authors: {
          include: {
            author: true
          }
        }
      }
    })

    if (!existingArticle) {
      return { success: false, error: "Article not found" }
    }

    // Check if user has permission to update articles
    const permissionCheck = checkPermission(currentUser, 'article.UPDATE')

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to update this article" 
      }
    }

    // Generate new slug if title is being updated
    let newSlug = slug
    if (data.title && data.title !== existingArticle.title) {
      newSlug = generateSlug(data.title)
      
      // Check for duplicate slug (excluding current article)
      if (newSlug !== slug) {
        const duplicateSlug = await prisma.article.findUnique({
          where: { slug: newSlug }
        })
        if (duplicateSlug) {
          return { success: false, error: "An article with this title already exists" }
        }
      }
    }

    // Calculate new read time if content is updated
    let readTime = existingArticle.readTime
    if (data.content) {
      readTime = data.readTime || calculateReadTime(data.content)
    }

    // Handle authors if provided
    let authors: any[] = []
    if (data.authorIds) {
      authors = await findOrCreateAuthors(data.authorIds)
      if (authors.length === 0) {
        return { success: false, error: "At least one valid author is required" }
      }
    }

    // Update the article in a transaction
    const updatedArticle = await prisma.$transaction(async (tx) => {
      // Update the article
      const article = await tx.article.update({
        where: { id: existingArticle.id },
        data: {
          ...(data.title && { title: data.title, slug: newSlug }),
          ...(data.content && { content: data.content, readTime }),
          ...(data.abstract !== undefined && { abstract: data.abstract }),
          ...(data.image !== undefined && { image: data.image }),
          ...(data.type && { type: data.type }),
          ...(data.featured !== undefined && { featured: data.featured }),
          ...(data.carousel !== undefined && { carousel: data.carousel }),
          ...(data.keywords !== undefined && { keywords: data.keywords }),
          ...(data.journalIssueId !== undefined && { issueId: data.journalIssueId }),
          ...(data.contentLink !== undefined && { contentLink: data.contentLink }),
          ...(data.archived !== undefined && { archived: data.archived }),
        }
      })

      // Update author relationships if authors were provided
      if (authors.length > 0) {
        // Remove all existing author relationships
        await tx.authorArticle.deleteMany({
          where: { articleId: existingArticle.id }
        })

        // Create new author relationships
        for (let i = 0; i < authors.length; i++) {
          await tx.authorArticle.create({
            data: {
              articleId: existingArticle.id,
              authorId: authors[i].id,
              authorOrder: i + 1,
            }
          })
        }
      }

      return article
    })

    console.log(`✅ Article updated successfully: ${updatedArticle.title}`)

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath("/featured")
    revalidatePath(`/${data.type === "blog" ? "blogs" : "journals"}/${updatedArticle.slug}`)
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article: updatedArticle }
  } catch (error) {
    console.error("Error updating article:", error)
    return { success: false, error: "Failed to update article" }
  }
}

export async function deleteArticle(slug: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Get the existing article to check ownership if needed
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      include: {
        authors: {
          include: {
            author: true
          }
        }
      }
    })

    if (!existingArticle) {
      return { success: false, error: "Article not found" }
    }

    // Check if user has permission to delete articles
    const permissionCheck = checkPermission(currentUser, 'article.DELETE')

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to delete this article" 
      }
    }

    // Delete the article (author relationships will be deleted automatically due to CASCADE)
    await prisma.article.delete({
      where: { id: existingArticle.id }
    })

    console.log(`🗑️ Article deleted: ${existingArticle.title}`)

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath("/featured")
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true }
  } catch (error) {
    console.error("Error deleting article:", error)
    return { success: false, error: "Failed to delete article" }
  }
}

// Additional action functions for better article management

export async function toggleArticleFeature(slug: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    const permissionCheck = checkPermission(currentUser, 'article.UPDATE')
    if (!permissionCheck.allowed) {
      return { success: false, error: "You don't have permission to update articles" }
    }

    const article = await prisma.article.findUnique({
      where: { slug }
    })

    if (!article) {
      return { success: false, error: "Article not found" }
    }

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: {
        featured: !article.featured
      }
    })

    revalidatePath("/")
    revalidatePath("/featured")
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article: updatedArticle }
  } catch (error) {
    console.error("Error toggling article feature:", error)
    return { success: false, error: "Failed to toggle article feature" }
  }
}

export async function toggleArticleCarousel(slug: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    const permissionCheck = checkPermission(currentUser, 'article.UPDATE')
    if (!permissionCheck.allowed) {
      return { success: false, error: "You don't have permission to update articles" }
    }

    const article = await prisma.article.findUnique({
      where: { slug }
    })

    if (!article) {
      return { success: false, error: "Article not found" }
    }

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: {
        carousel: !article.carousel
      }
    })

    revalidatePath("/")
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article: updatedArticle }
  } catch (error) {
    console.error("Error toggling article carousel:", error)
    return { success: false, error: "Failed to toggle article carousel" }
  }
}

export async function toggleArticleArchive(slug: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    const permissionCheck = checkPermission(currentUser, 'article.UPDATE')
    if (!permissionCheck.allowed) {
      return { success: false, error: "You don't have permission to update articles" }
    }

    const article = await prisma.article.findUnique({
      where: { slug }
    })

    if (!article) {
      return { success: false, error: "Article not found" }
    }

    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: {
        archived: !article.archived
      }
    })

    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article: updatedArticle }
  } catch (error) {
    console.error("Error toggling article archive:", error)
    return { success: false, error: "Failed to toggle article archive" }
  }
}

export async function incrementArticleViews(slug: string) {
  try {
    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: {
        views: { increment: 1 }
      }
    })

    return { success: true, article: updatedArticle }
  } catch (error) {
    console.error("Error incrementing article views:", error)
    return { success: false, error: "Failed to increment article views" }
  }
}

export async function incrementArticleDownloads(slug: string) {
  try {
    const updatedArticle = await prisma.article.update({
      where: { slug },
      data: {
        downloadCount: { increment: 1 }
      }
    })

    return { success: true, article: updatedArticle }
  } catch (error) {
    console.error("Error incrementing article downloads:", error)
    return { success: false, error: "Failed to increment article downloads" }
  }
}
