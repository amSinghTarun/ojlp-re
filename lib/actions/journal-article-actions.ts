// lib/actions/journal-article-actions.ts - Updated for actual schema
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

// Updated form schema to match actual Article model
const journalArticleSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().min(3).max(100),
  abstract: z.string().min(20).max(500), // Changed from 'excerpt'
  content: z.string().min(100),
  publishedAt: z.date(), // Changed from 'date'
  readTime: z.number().int().min(1).max(180),
  image: z.string().optional(),
  authors: z.array(authorSchema).min(1).max(10),
  issueId: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  archived: z.boolean().default(false), // Changed from 'draft' (inverted logic)
  contentLink: z.string().optional(),
  featured: z.boolean().default(false),
  carousel: z.boolean().default(false),
})

type JournalArticleFormData = z.infer<typeof journalArticleSchema>

// Helper function to create error responses
function createErrorResponse(message: string, details?: string) {
  return { 
    error: details ? `${message} Details: ${details}` : message 
  }
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

/**
 * Get a single journal article with all its authors
 */
export async function getJournalArticle(slug: string) {
  try {
    console.log(`🔍 Fetching journal article: ${slug}`)
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to read articles
    const permissionCheck = checkPermission(currentUser, 'article.READ')
    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to view journal articles"
      )
    }
    
    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid article slug provided.")
    }

    const article = await prisma.article.findUnique({
      where: { 
        slug,
        type: 'journal',
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
        JournalIssue: true,
      },
    })

    if (!article) {
      return createErrorResponse("Journal article not found. It may have been deleted or the slug is incorrect.")
    }

    // Transform the data to match form expectations
    const transformedArticle = {
      ...article,
      Authors: article.authors.map(aa => aa.author),
      // Map schema fields to form fields
      excerpt: article.abstract, // For backward compatibility
      date: article.publishedAt,
      draft: article.archived, // Inverted logic
      journalIssue: article.JournalIssue
    }

    console.log(`✅ User ${currentUser.email} fetched journal article: ${article.title} with ${article.authors.length} author(s)`)
    return { article: transformedArticle }
  } catch (error: any) {
    console.error("❌ Failed to fetch journal article:", error)
    return createErrorResponse("Failed to fetch journal article details. Please try again.", error.message)
  }
}

/**
 * Get all journal articles with their authors
 */
export async function getJournalArticles() {
  try {
    console.log("📰 Fetching journal articles...")
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to read articles
    const permissionCheck = checkPermission(currentUser, 'article.READ')
    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to view journal articles"
      )
    }
    
    const articles = await prisma.article.findMany({
      where: {
        type: 'journal',
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
        JournalIssue: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the data to match UI expectations
    const transformedArticles = articles.map(article => ({
      ...article,
      Authors: article.authors.map(aa => aa.author),
      Author: article.authors.length > 0 ? article.authors[0].author : null,
      // Map schema fields to form fields
      excerpt: article.abstract,
      date: article.publishedAt,
      draft: article.archived, // Inverted logic
      journalIssue: article.JournalIssue
    }))

    console.log(`✅ User ${currentUser.email} fetched ${articles.length} journal articles`)
    return { articles: transformedArticles }
  } catch (error: any) {
    console.error("❌ Failed to fetch journal articles:", error)
    return createErrorResponse("Failed to fetch journal articles. Please try again.", error.message)
  }
}

/**
 * Create a new journal article with multiple authors
 */
export async function createJournalArticle(data: JournalArticleFormData) {
  try {
    console.log("🚀 Creating journal article with multiple authors...")
    
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
        error: permissionCheck.reason || "You don't have permission to create journal articles" 
      }
    }
    
    // Validate the input data
    const validation = journalArticleSchema.safeParse(data)
    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error)
      return { 
        success: false, 
        error: "Validation failed: " + validation.error.errors.map(e => e.message).join(", ") 
      }
    }

    const validatedData = validation.data

    // Check for duplicate slug
    const existingSlug = await prisma.article.findUnique({
      where: { slug: validatedData.slug }
    })
    if (existingSlug) {
      return { success: false, error: "An article with this slug already exists" }
    }

    // Find or create all authors
    const authors = await findOrCreateAuthors(validatedData.authors)

    // Create the article with authors in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the article
      const article = await tx.article.create({
        data: {
          title: validatedData.title,
          slug: validatedData.slug,
          abstract: validatedData.abstract,
          content: validatedData.content,
          contentLink: validatedData.contentLink,
          publishedAt: validatedData.publishedAt,
          readTime: validatedData.readTime,
          image: validatedData.image || null,
          type: 'journal',
          issueId: validatedData.issueId || null,
          keywords: validatedData.keywords,
          archived: validatedData.archived,
          featured: validatedData.featured,
          carousel: validatedData.carousel,
        }
      })

      // Create author-article relationships
      for (let i = 0; i < authors.length; i++) {
        await tx.authorArticle.create({
          data: {
            articleId: article.id,
            authorId: authors[i].id,
            authorOrder: i + 1,
          }
        })
      }

      return article
    })

    console.log(`✅ User ${currentUser.email} created journal article: ${result.title}`)
    console.log(`👥 With ${authors.length} author(s): ${authors.map(a => a.name).join(", ")}`)

    // Revalidate relevant pages
    revalidatePath("/admin/journal-articles")
    revalidatePath("/articles")
    
    return { success: true, data: result }

  } catch (error) {
    console.error("💥 Error creating article:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create article" 
    }
  }
}

/**
 * Update an existing journal article with multiple authors
 */
export async function updateJournalArticle(slug: string, data: JournalArticleFormData) {
  try {
    console.log(`🔄 Updating journal article: ${slug}`)
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Find the existing article
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      include: {
        authors: {
          include: { author: true },
          orderBy: { authorOrder: 'asc' }
        }
      }
    })

    if (!existingArticle) {
      return { success: false, error: "Article not found" }
    }
    
    const permissionCheck = checkPermission(currentUser, 'article.UPDATE')

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to update this journal article" 
      }
    }
    
    // Validate the input data
    const validation = journalArticleSchema.safeParse(data)
    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error)
      return { 
        success: false, 
        error: "Validation failed: " + validation.error.errors.map(e => e.message).join(", ") 
      }
    }

    const validatedData = validation.data

    // Check for duplicate slug (excluding current article)
    if (validatedData.slug !== slug) {
      const duplicateSlug = await prisma.article.findUnique({
        where: { slug: validatedData.slug }
      })
      if (duplicateSlug) {
        return { success: false, error: "An article with this slug already exists" }
      }
    }

    // Find or create all authors
    const authors = await findOrCreateAuthors(validatedData.authors)

    // Update the article and its authors in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the article
      const updatedArticle = await tx.article.update({
        where: { id: existingArticle.id },
        data: {
          title: validatedData.title,
          slug: validatedData.slug,
          abstract: validatedData.abstract,
          content: validatedData.content,
          contentLink: validatedData.contentLink,
          publishedAt: validatedData.publishedAt,
          readTime: validatedData.readTime,
          image: validatedData.image || null,
          issueId: validatedData.issueId || null,
          keywords: validatedData.keywords,
          archived: validatedData.archived,
          featured: validatedData.featured,
          carousel: validatedData.carousel,
        }
      })

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

      return updatedArticle
    })

    console.log(`✅ User ${currentUser.email} updated journal article: ${result.title}`)
    console.log(`👥 With ${authors.length} author(s): ${authors.map(a => a.name).join(", ")}`)

    // Revalidate relevant pages
    revalidatePath("/admin/journal-articles")
    revalidatePath("/articles")
    revalidatePath(`/articles/${result.slug}`)
    
    return { success: true, data: result }

  } catch (error) {
    console.error("💥 Error updating article:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update article" 
    }
  }
}

/**
 * Delete a journal article (will cascade to author relationships)
 */
export async function deleteJournalArticle(slug: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Find the existing article
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      include: {
        authors: {
          include: { author: true }
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
        error: permissionCheck.reason || "You don't have permission to delete this journal article" 
      }
    }

    // Delete the article (author relationships will be deleted automatically due to CASCADE)
    await prisma.article.delete({
      where: { id: existingArticle.id }
    })

    console.log(`🗑️ User ${currentUser.email} deleted journal article: ${existingArticle.title}`)

    // Revalidate relevant pages
    revalidatePath("/admin/journal-articles")
    revalidatePath("/articles")
    
    return { success: true }
  } catch (error) {
    console.error("💥 Error deleting article:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete article" 
    }
  }
}

/**
 * Get journal issues for dropdown
 */
export async function getJournalIssuesForDropdown() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to view journal issues" 
      }
    }

    const issues = await prisma.journalIssue.findMany({
      select: {
        id: true,
        volume: true,
        issue: true,
        year: true,
        theme: true,
      },
      orderBy: [
        { year: 'desc' },
        { volume: 'desc' },
        { issue: 'desc' }
      ]
    })

    console.log(`✅ User ${currentUser.email} fetched ${issues.length} journal issues for dropdown`)
    return { success: true, issues }
  } catch (error) {
    console.error("💥 Error fetching journal issues:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch journal issues" 
    }
  }
}