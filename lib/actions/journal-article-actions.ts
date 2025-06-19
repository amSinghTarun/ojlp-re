"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ArticleType } from "@prisma/client"
// import { checkPermissions } from "@/lib/auth/permissions"

// Helper functions
function createErrorResponse(message: string, details?: any) {
  return {
    success: false,
    error: message,
    details,
  }
}

function createSuccessResponse(data: any) {
  return {
    success: true,
    data,
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Updated schema with author email and name instead of authorId
const journalArticleSchema = z.object({
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
  authorEmail: z.string()
    .min(1, "Author email is required")
    .email("Please enter a valid email address"),
  authorName: z.string()
    .min(1, "Author name is required")
    .min(2, "Author name must be at least 2 characters")
    .max(100, "Author name must be less than 100 characters"),
  issueId: z.string().optional(),
  doi: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  categories: z.array(z.string()).default([]),
})

export type JournalArticleFormData = z.infer<typeof journalArticleSchema>

// Helper function to find or create author
async function findOrCreateAuthor(email: string, name: string) {
  console.log(`🔍 Looking for author with email: ${email}`)
  
  // Try to find existing author by email
  let author = await prisma.author.findUnique({
    where: { email },
  })

  if (author) {
    console.log(`✅ Found existing author: ${author.name} (${author.email})`)
    
    // Update name if it's different (in case the name was updated)
    if (author.name !== name) {
      console.log(`📝 Updating author name from "${author.name}" to "${name}"`)
      author = await prisma.author.update({
        where: { id: author.id },
        data: { name },
      })
    }
    
    return author
  }

  // Create new author with email as slug
  console.log(`➕ Creating new author: ${name} (${email})`)
  author = await prisma.author.create({
    data: {
      name,
      email,
      slug: email, // Use email as the slug
      bio: `Author at our journal`, // Default bio
    },
  })

  console.log(`✅ Created new author with ID: ${author.id}`)
  return author
}

export async function getJournalArticle(slug: string) {
  try {
    console.log(`🔍 Fetching journal article: ${slug}`)
    
    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid article slug provided.")
    }

    const article = await prisma.article.findUnique({
      where: { 
        slug,
        type: ArticleType.journal,
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

export async function getJournalArticles() {
  try {
    console.log("📰 Fetching journal articles...")
    
    const articles = await prisma.article.findMany({
      where: {
        type: ArticleType.journal,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`✅ Found ${articles.length} journal articles`)
    return { articles }
  } catch (error: any) {
    console.error("❌ Failed to fetch journal articles:", error)
    
    if (error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to fetch journal articles. Please try again.", error.message)
  }
}

export async function getJournalIssuesForDropdown() {
  try {
    const issues = await prisma.journalIssue.findMany({
      select: {
        id: true,
        title: true,
        volume: true,
        issue: true,
        year: true,
      },
      orderBy: [
        { year: 'desc' },
        { volume: 'desc' },
        { issue: 'desc' },
      ],
    })

    return { issues }
  } catch (error: any) {
    console.error("❌ Failed to fetch journal issues:", error)
    return createErrorResponse("Failed to fetch journal issues. Please try again.", error.message)
  }
}

export async function getJournalArticleBySlug(slug: string) {
  try {
    console.log(`🔍 Fetching journal article: ${slug}`)
    
    if (!slug || typeof slug !== 'string') {
      return createErrorResponse("Invalid article slug provided.")
    }

    const article = await prisma.article.findUnique({
      where: { 
        slug,
        type: ArticleType.journal,
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
    
    // const user = await checkPermissions()
    
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

    // Find or create author
    const author = await findOrCreateAuthor(validatedData.authorEmail, validatedData.authorName)

    // Check if journal issue exists (if provided)
    if (validatedData.issueId) {
      const issue = await prisma.journalIssue.findUnique({
        where: { id: validatedData.issueId },
      })

      if (!issue) {
        return createErrorResponse("Selected journal issue not found. Please choose a valid issue.")
      }
    }

    // Check for DOI uniqueness if provided
    if (validatedData.doi) {
      const existingDoi = await prisma.article.findFirst({
        where: { doi: validatedData.doi },
      })

      if (existingDoi) {
        return createErrorResponse("An article with this DOI already exists. Please use a different DOI.")
      }
    }

    console.log("✅ All references validated, proceeding with creation...")

    const { categories, authorEmail, authorName, issueId, ...articleData } = validatedData

    const article = await prisma.article.create({
      data: {
        ...articleData,
        slug: finalSlug,
        type: ArticleType.journal,
        views: 0,
        Author: {
          connect: { id: author.id }
        },
        journalIssue: issueId ? {
          connect: { id: issueId }
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
      if (error.meta?.target?.includes('email')) {
        return createErrorResponse("An author with this email already exists but with different details.")
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
    
    // const user = await checkPermissions()
    
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

    // Check for DOI uniqueness if provided (excluding current article)
    if (validatedData.doi) {
      const existingDoi = await prisma.article.findFirst({
        where: {
          doi: validatedData.doi,
          NOT: { id: existing.id },
        },
      })

      if (existingDoi) {
        return createErrorResponse("Another article with this DOI already exists. Please use a different DOI.")
      }
    }

    // Find or create author
    const author = await findOrCreateAuthor(validatedData.authorEmail, validatedData.authorName)

    // Validate journal issue if provided
    if (validatedData.issueId) {
      const issue = await prisma.journalIssue.findUnique({
        where: { id: validatedData.issueId },
      })

      if (!issue) {
        return createErrorResponse("Selected journal issue not found. Please choose a valid issue.")
      }
    }

    const { categories, authorEmail, authorName, issueId, ...articleData } = validatedData

    // First, disconnect all existing categories
    await prisma.categoryArticle.deleteMany({
      where: { articleId: existing.id },
    })

    const article = await prisma.article.update({
      where: { id: existing.id },
      data: {
        ...articleData,
        Author: {
          connect: { id: author.id }
        },
        journalIssue: issueId ? {
          connect: { id: issueId }
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
    
    // const user = await checkPermissions()
    
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

    // Delete the article (categories will be deleted automatically via cascade)
    await prisma.article.delete({
      where: { id: existing.id },
    })

    console.log(`✅ Journal article deleted: ${existing.title}`)

    // Revalidate relevant paths
    revalidatePath("/admin/journal-articles")
    revalidatePath("/journals")
    revalidatePath("/articles")

    return createSuccessResponse({ message: "Journal article deleted successfully" })
  } catch (error: any) {
    console.error("❌ Failed to delete journal article:", error)
    
    if (error.code === 'P2025') {
      return createErrorResponse("Journal article not found. It may have already been deleted.")
    }
    
    if (error.message?.includes('permission') || error.message?.includes('Unauthorized')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to delete journal article. Please try again.", error.message)
  }
}