"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { ArticleType } from "@prisma/client"

// Enhanced schema matching the Prisma Article model
const journalArticleSchema = z.object({
  id: z.string().optional(),
  title: z.string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  excerpt: z.string()
    .min(1, "Excerpt is required")
    .min(20, "Excerpt must be at least 20 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string()
    .min(1, "Content is required")
    .min(100, "Content must be at least 100 characters"),
  date: z.coerce.date({ required_error: "Publication date is required" }),
  readTime: z.coerce.number()
    .min(1, "Read time must be at least 1 minute")
    .max(180, "Read time must be less than 180 minutes")
    .int("Read time must be a whole number"),
  image: z.string()
    .min(1, "Featured image is required")
    .refine((val) => val.startsWith('http'), {
      message: "Featured image must be a valid URL starting with http or https"
    }),
  images: z.array(z.string()).default([]),
  authorId: z.string().min(1, "Author is required"),
  issueId: z.string().optional(),
  doi: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  categories: z.array(z.string()).default([]),
})

export type JournalArticleFormData = z.infer<typeof journalArticleSchema>

// Helper function to check permissions
async function checkPermissions() {
  const user = await getCurrentUser()
  if (!user || !hasPermission(user, PERMISSIONS.MANAGE_ARTICLES)) {
    throw new Error("Unauthorized: You don't have permission to manage journal articles")
  }
  return user
}

// Enhanced error handling
function createErrorResponse(message: string, details?: any) {
  console.error(`❌ Journal Article Error:`, message, details)
  return { error: message, details }
}

function createSuccessResponse(article: any) {
  console.log(`✅ Journal Article Success:`, article.title)
  return { success: true, article }
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

export async function getJournalArticles() {
  try {
    console.log("📰 Fetching journal articles...")
    await checkPermissions()
    
    const articles = await prisma.article.findMany({
      where: {
        type: ArticleType.journal,
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        Author: true,
        journalIssue: true,
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            categories: true,
          },
        },
      },
    })

    console.log(`✅ Successfully fetched ${articles.length} journal articles`)
    return { articles }
  } catch (error: any) {
    console.error("❌ Failed to fetch journal articles:", error)
    
    if (error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to fetch journal articles. Please try again.", error.message)
  }
}

export async function getJournalArticle(slug: string) {
  try {
    console.log(`📰 Fetching journal article: ${slug}`)
    await checkPermissions()
    
    if (!slug || typeof slug !== 'string') {
      throw new Error("Invalid article slug provided.")
    }
    
    const article = await prisma.article.findUnique({
      where: { 
        slug,
        type: ArticleType.journal 
      },
      include: {
        Author: true,
        journalIssue: true,
        categories: {
          include: {
            category: true,
          },
        },
        authors: {
          include: {
            author: true,
          },
        },
      },
    })

    if (!article) {
      return createErrorResponse("Journal article not found. It may have been deleted or the slug is incorrect.")
    }

    console.log(`✅ Successfully fetched journal article: ${article.title}`)
    return { article }
  } catch (error: any) {
    console.error("❌ Failed to fetch journal article:", error)
    
    if (error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to fetch journal article details. Please try again.", error.message)
  }
}

export async function createJournalArticle(data: JournalArticleFormData) {
  try {
    console.log("📰 Creating journal article...")
    console.log("📋 Input data:", data)
    
    const user = await checkPermissions()
    
    // Enhanced validation
    const validation = journalArticleSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ')
      
      console.error("❌ Validation failed:", validation.error.errors)
      return createErrorResponse(`Validation failed: ${errors}`, validation.error.errors)
    }

    const validatedData = validation.data
    console.log("✅ Data validation passed")

    // Auto-generate slug if not provided or ensure uniqueness
    let finalSlug = validatedData.slug
    const existingSlug = await prisma.article.findUnique({
      where: { slug: finalSlug },
    })

    if (existingSlug) {
      // Generate unique slug by appending number
      let counter = 1
      let newSlug = `${finalSlug}-${counter}`
      
      while (await prisma.article.findUnique({ where: { slug: newSlug } })) {
        counter++
        newSlug = `${finalSlug}-${counter}`
      }
      
      finalSlug = newSlug
      console.log(`✅ Generated unique slug: ${finalSlug}`)
    }

    // Check if author exists
    const author = await prisma.author.findUnique({
      where: { id: validatedData.authorId },
    })

    if (!author) {
      return createErrorResponse("Selected author not found. Please choose a valid author.")
    }

    // Check if journal issue exists (if provided)
    if (validatedData.issueId) {
      const issue = await prisma.journalIssue.findUnique({
        where: { id: validatedData.issueId },
      })

      if (!issue) {
        return createErrorResponse("Selected journal issue not found. Please choose a valid issue.")
      }
    }

    console.log("✅ All references validated, proceeding with creation...")

    const { categories, ...articleData } = validatedData

    const article = await prisma.article.create({
      data: {
        ...articleData,
        slug: finalSlug,
        type: ArticleType.journal,
        views: 0,
        Author: {
          connect: { id: validatedData.authorId }
        },
        journalIssue: validatedData.issueId ? {
          connect: { id: validatedData.issueId }
        } : undefined,
        categories: categories && categories.length > 0 ? {
          create: categories.map(categoryName => ({
            category: {
              connectOrCreate: {
                where: { slug: generateSlug(categoryName) },
                create: {
                  name: categoryName,
                  slug: generateSlug(categoryName),
                },
              },
            },
          })),
        } : undefined,
      },
      include: {
        Author: true,
        journalIssue: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    console.log(`✅ Journal article created with ID: ${article.id}`)

    // Revalidate relevant paths
    revalidatePath("/admin/journal-articles")
    revalidatePath("/journals")
    revalidatePath("/articles")

    return createSuccessResponse(article)
  } catch (error: any) {
    console.error("❌ Failed to create journal article:", error)
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('slug')) {
        return createErrorResponse("An article with this slug already exists. Please use a different slug.")
      }
      if (error.meta?.target?.includes('doi')) {
        return createErrorResponse("An article with this DOI already exists. Please use a different DOI.")
      }
      return createErrorResponse("An article with these details already exists. Please check for duplicates.")
    }
    
    if (error.code === 'P2025') {
      return createErrorResponse("Referenced record not found. Please refresh the page and try again.")
    }
    
    if (error.code === 'P1001') {
      return createErrorResponse("Database connection failed. Please check your internet connection and try again.")
    }
    
    if (error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to create journal article. Please try again.", error.message)
  }
}

export async function updateJournalArticle(slug: string, data: JournalArticleFormData) {
  try {
    console.log(`📰 Updating journal article: ${slug}`)
    console.log("📋 Input data:", data)
    
    const user = await checkPermissions()
    
    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid article slug provided.")
    }
    
    // Enhanced validation
    const validation = journalArticleSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ')
      
      console.error("❌ Validation failed:", validation.error.errors)
      return createErrorResponse(`Validation failed: ${errors}`, validation.error.errors)
    }

    const validatedData = validation.data
    console.log("✅ Data validation passed")

    // Check if the article exists
    const existing = await prisma.article.findUnique({
      where: { slug, type: ArticleType.journal },
    })

    if (!existing) {
      return createErrorResponse("Journal article not found. It may have been deleted or the slug is incorrect.")
    }

    console.log(`✅ Found existing article: ${existing.title}`)

    // Check for slug uniqueness (excluding current article)
    if (validatedData.slug !== slug) {
      const slugExists = await prisma.article.findFirst({
        where: {
          slug: validatedData.slug,
          NOT: { id: existing.id },
        },
      })

      if (slugExists) {
        return createErrorResponse("Another article with this slug already exists. Please use a different slug.")
      }
    }

    // Validate references
    const author = await prisma.author.findUnique({
      where: { id: validatedData.authorId },
    })

    if (!author) {
      return createErrorResponse("Selected author not found. Please choose a valid author.")
    }

    if (validatedData.issueId) {
      const issue = await prisma.journalIssue.findUnique({
        where: { id: validatedData.issueId },
      })

      if (!issue) {
        return createErrorResponse("Selected journal issue not found. Please choose a valid issue.")
      }
    }

    const { categories, ...articleData } = validatedData

    // First, disconnect all existing categories
    await prisma.categoryArticle.deleteMany({
      where: { articleId: existing.id },
    })

    const article = await prisma.article.update({
      where: { id: existing.id },
      data: {
        ...articleData,
        Author: {
          connect: { id: validatedData.authorId }
        },
        journalIssue: validatedData.issueId ? {
          connect: { id: validatedData.issueId }
        } : {
          disconnect: true
        },
        categories: categories && categories.length > 0 ? {
          create: categories.map(categoryName => ({
            category: {
              connectOrCreate: {
                where: { slug: generateSlug(categoryName) },
                create: {
                  name: categoryName,
                  slug: generateSlug(categoryName),
                },
              },
            },
          })),
        } : undefined,
      },
      include: {
        Author: true,
        journalIssue: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    console.log(`✅ Journal article updated: ${article.title}`)

    revalidatePath("/admin/journal-articles")
    revalidatePath(`/admin/journal-articles/${article.slug}/edit`)
    revalidatePath("/journals")
    revalidatePath("/articles")

    return createSuccessResponse(article)
  } catch (error: any) {
    console.error("❌ Failed to update journal article:", error)
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('slug')) {
        return createErrorResponse("An article with this slug already exists. Please use a different slug.")
      }
      if (error.meta?.target?.includes('doi')) {
        return createErrorResponse("An article with this DOI already exists. Please use a different DOI.")
      }
      return createErrorResponse("An article with these details already exists. Please check for duplicates.")
    }
    
    if (error.code === 'P2025') {
      return createErrorResponse("Article not found. It may have been deleted. Please refresh the page.")
    }
    
    if (error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to update journal article. Please try again.", error.message)
  }
}

export async function deleteJournalArticle(slug: string) {
  try {
    console.log(`🗑️ Deleting journal article: ${slug}`)
    
    const user = await checkPermissions()
    
    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid article slug provided.")
    }
    
    // Check if the article exists
    const existing = await prisma.article.findUnique({
      where: { slug, type: ArticleType.journal },
    })

    if (!existing) {
      return createErrorResponse("Journal article not found. It may have already been deleted.")
    }

    console.log(`✅ Found article to delete: ${existing.title}`)

    // Delete the article (cascade will handle related records)
    await prisma.article.delete({
      where: { id: existing.id },
    })

    revalidatePath("/admin/journal-articles")
    revalidatePath("/journals")
    revalidatePath("/articles")

    console.log(`✅ Deleted journal article "${existing.title}"`)

    return { success: true }
  } catch (error: any) {
    console.error("❌ Failed to delete journal article:", error)
    
    if (error.code === 'P2025') {
      return createErrorResponse("Article not found. It may have already been deleted.")
    }
    
    if (error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to delete journal article. Please try again.", error.message)
  }
}

// Get all authors for form dropdowns
export async function getAuthors() {
  try {
    const authors = await prisma.author.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return { authors }
  } catch (error: any) {
    console.error("❌ Failed to fetch authors:", error)
    return createErrorResponse("Failed to fetch authors. Please try again.", error.message)
  }
}

// Get all journal issues for form dropdowns
export async function getJournalIssuesForDropdown() {
  try {
    const issues = await prisma.journalIssue.findMany({
      orderBy: [
        { year: "desc" },
        { volume: "desc" },
        { issue: "desc" }
      ],
      select: {
        id: true,
        title: true,
        volume: true,
        issue: true,
        year: true,
      },
    })

    return { issues }
  } catch (error: any) {
    console.error("❌ Failed to fetch journal issues:", error)
    return createErrorResponse("Failed to fetch journal issues. Please try again.", error.message)
  }
}

// Get published journal articles for public display (no auth required)
export async function getPublishedJournalArticles() {
  try {
    console.log("📰 Fetching published journal articles (public)...")
    
    const articles = await prisma.article.findMany({
      where: {
        type: ArticleType.journal,
        draft: false,
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        Author: true,
        journalIssue: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    console.log(`✅ Successfully fetched ${articles.length} published journal articles`)
    return { articles }
  } catch (error: any) {
    console.error("❌ Failed to fetch published journal articles:", error)
    return createErrorResponse("Failed to fetch journal articles. Please try again later.", error.message)
  }
}