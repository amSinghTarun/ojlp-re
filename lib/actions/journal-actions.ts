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

const journalIssueSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  volume: z.coerce.number().min(1, "Volume must be at least 1"),
  issue: z.coerce.number().min(1, "Issue must be at least 1"),
  year: z.coerce.number().min(1900, "Year must be valid"),
  publishDate: z.string().min(1, "Publish date is required"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  pdfUrl: z.string().optional(),
  articles: z.array(z.string()).optional(),
})

export type JournalIssueFormData = z.infer<typeof journalIssueSchema>

export async function getJournalIssues() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { error: "Authentication required" }
    }

    // Check if user has permission to read journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.READ')
    if (!permissionCheck.allowed) {
      return { 
        error: permissionCheck.reason || "You don't have permission to view journal issues" 
      }
    }

    const issues = await prisma.journalIssue.findMany({
      orderBy: [{ year: "desc" }, { volume: "desc" }, { issue: "desc" }],
      include: {
        Article: true,
      },
    })

    console.log(`✅ User ${currentUser.email} fetched ${issues.length} journal issues`)
    return { issues }
  } catch (error) {
    console.error("Failed to fetch journal issues:", error)
    return { error: "Failed to fetch journal issues" }
  }
}

export async function getJournalIssue(id: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { error: "Authentication required" }
    }

    // Check if user has permission to read journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.READ')
    if (!permissionCheck.allowed) {
      return { 
        error: permissionCheck.reason || "You don't have permission to view journal issue details" 
      }
    }

    if (!id || typeof id !== 'string') {
      return { error: "Invalid journal issue ID provided" }
    }

    const issue = await prisma.journalIssue.findUnique({
      where: { id },
      include: {
        Article: true,
      },
    })

    if (!issue) {
      return { error: "Journal issue not found" }
    }

    console.log(`✅ User ${currentUser.email} viewed journal issue: Volume ${issue.volume}, Issue ${issue.issue} (${issue.year})`)
    return { issue }
  } catch (error) {
    console.error("Failed to fetch journal issue:", error)
    return { error: "Failed to fetch journal issue" }
  }
}

export async function createJournalIssue(data: JournalIssueFormData) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { error: "Authentication required" }
    }

    // Check if user has permission to create journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        error: permissionCheck.reason || "You don't have permission to create journal issues" 
      }
    }

    // Validate input data
    const validatedData = journalIssueSchema.parse(data)

    // Check for duplicate volume/issue/year combination
    const existingIssue = await prisma.journalIssue.findFirst({
      where: {
        volume: validatedData.volume,
        issue: validatedData.issue,
        year: validatedData.year,
      },
    })

    if (existingIssue) {
      return { 
        error: `A journal issue already exists for Volume ${validatedData.volume}, Issue ${validatedData.issue} (${validatedData.year})` 
      }
    }

    // Validate article IDs if provided
    if (validatedData.articles && validatedData.articles.length > 0) {
      const existingArticles = await prisma.article.findMany({
        where: { id: { in: validatedData.articles } },
        select: { id: true, title: true, issueId: true }
      })

      if (existingArticles.length !== validatedData.articles.length) {
        return { error: "Some selected articles were not found" }
      }

      // Check if any articles are already assigned to other issues
      const assignedArticles = existingArticles.filter(article => article.issueId)
      if (assignedArticles.length > 0) {
        return { 
          error: `Some articles are already assigned to other journal issues: ${assignedArticles.map(a => a.title).join(', ')}` 
        }
      }
    }

    const { articles, ...issueData } = validatedData

    const issue = await prisma.journalIssue.create({
      data: {
        ...issueData,
        Article:
          articles && articles.length > 0
            ? {
                connect: articles.map((id) => ({ id })),
              }
            : undefined,
      },
    })

    console.log(`✅ User ${currentUser.email} created journal issue: Volume ${issue.volume}, Issue ${issue.issue} (${issue.year})`)

    revalidatePath("/admin/journals")
    revalidatePath("/journals")
    
    return { success: true, issue }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") }
    }
    console.error("Failed to create journal issue:", error)
    return { error: "Failed to create journal issue" }
  }
}

export async function updateJournalIssue(id: string, data: JournalIssueFormData) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { error: "Authentication required" }
    }

    if (!id || typeof id !== 'string') {
      return { error: "Invalid journal issue ID provided" }
    }

    // Get the existing journal issue
    const existingIssue = await prisma.journalIssue.findUnique({
      where: { id },
      include: { Article: true }
    })

    if (!existingIssue) {
      return { error: "Journal issue not found" }
    }

    // Check if user has permission to update journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.UPDATE', {
      resourceId: existingIssue.id
    })

    if (!permissionCheck.allowed) {
      return { 
        error: permissionCheck.reason || "You don't have permission to update this journal issue" 
      }
    }

    // Validate input data
    const validatedData = journalIssueSchema.parse(data)

    // Check for duplicate volume/issue/year combination (excluding current issue)
    const duplicateIssue = await prisma.journalIssue.findFirst({
      where: {
        volume: validatedData.volume,
        issue: validatedData.issue,
        year: validatedData.year,
        NOT: { id },
      },
    })

    if (duplicateIssue) {
      return { 
        error: `Another journal issue already exists for Volume ${validatedData.volume}, Issue ${validatedData.issue} (${validatedData.year})` 
      }
    }

    // Validate article IDs if provided
    if (validatedData.articles && validatedData.articles.length > 0) {
      const existingArticles = await prisma.article.findMany({
        where: { id: { in: validatedData.articles } },
        select: { id: true, title: true, issueId: true }
      })

      if (existingArticles.length !== validatedData.articles.length) {
        return { error: "Some selected articles were not found" }
      }

      // Check if any articles are already assigned to other issues (excluding current issue)
      const assignedArticles = existingArticles.filter(article => 
        article.issueId && article.issueId !== id
      )
      if (assignedArticles.length > 0) {
        return { 
          error: `Some articles are already assigned to other journal issues: ${assignedArticles.map(a => a.title).join(', ')}` 
        }
      }
    }

    const { articles, ...issueData } = validatedData

    // First disconnect all articles
    await prisma.journalIssue.update({
      where: { id },
      data: {
        Article: {
          set: [],
        },
      },
    })

    // Then update with new data and connect new articles
    const issue = await prisma.journalIssue.update({
      where: { id },
      data: {
        ...issueData,
        Article:
          articles && articles.length > 0
            ? {
                connect: articles.map((articleId) => ({ id: articleId })),
              }
            : undefined,
      },
    })

    console.log(`✅ User ${currentUser.email} updated journal issue: Volume ${issue.volume}, Issue ${issue.issue} (${issue.year})`)

    revalidatePath("/admin/journals")
    revalidatePath(`/admin/journals/${id}/edit`)
    revalidatePath("/journals")
    
    return { success: true, issue }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") }
    }
    console.error("Failed to update journal issue:", error)
    return { error: "Failed to update journal issue" }
  }
}

export async function deleteJournalIssue(id: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { error: "Authentication required" }
    }

    if (!id || typeof id !== 'string') {
      return { error: "Invalid journal issue ID provided" }
    }

    // Get the existing journal issue
    const existingIssue = await prisma.journalIssue.findUnique({
      where: { id },
      include: { Article: true }
    })

    if (!existingIssue) {
      return { error: "Journal issue not found" }
    }

    // Check if user has permission to delete journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.DELETE', {
      resourceId: existingIssue.id
    })

    if (!permissionCheck.allowed) {
      return { 
        error: permissionCheck.reason || "You don't have permission to delete this journal issue" 
      }
    }

    // Check if issue has articles - require confirmation or special permission
    if (existingIssue.Article && existingIssue.Article.length > 0) {
      return { 
        error: `Cannot delete journal issue with ${existingIssue.Article.length} associated article(s). Please reassign or remove articles first.` 
      }
    }

    // First disconnect all articles (should be none at this point, but safety first)
    await prisma.journalIssue.update({
      where: { id },
      data: {
        Article: {
          set: [],
        },
      },
    })

    // Then delete the issue
    await prisma.journalIssue.delete({
      where: { id },
    })

    console.log(`✅ User ${currentUser.email} deleted journal issue: Volume ${existingIssue.volume}, Issue ${existingIssue.issue} (${existingIssue.year})`)

    revalidatePath("/admin/journals")
    revalidatePath("/journals")
    
    return { success: true }
  } catch (error) {
    console.error("Failed to delete journal issue:", error)
    return { error: "Failed to delete journal issue" }
  }
}

// NEW: Function to get journal issues with permission context
export async function getJournalIssuesWithPermissions() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { error: "Authentication required" }
    }

    // Check if user has permission to read journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.READ')
    if (!permissionCheck.allowed) {
      return { 
        error: "You don't have permission to view journal issues" 
      }
    }

    const issues = await prisma.journalIssue.findMany({
      orderBy: [{ year: "desc" }, { volume: "desc" }, { issue: "desc" }],
      include: {
        Article: true,
      },
    })

    // Add permission context to each issue
    const issuesWithPermissions = issues.map(issue => ({
      ...issue,
      canEdit: checkPermission(currentUser, 'journalissue.UPDATE', {
        resourceId: issue.id
      }).allowed,
      canDelete: checkPermission(currentUser, 'journalissue.DELETE', {
        resourceId: issue.id
      }).allowed,
    }))

    return { 
      issues: issuesWithPermissions,
      canCreate: checkPermission(currentUser, 'journalissue.CREATE').allowed
    }
  } catch (error) {
    console.error("Failed to fetch journal issues with permissions:", error)
    return { error: "Failed to fetch journal issues" }
  }
}

// NEW: Function to check journal issue permissions
export async function checkJournalIssuePermissions(issueId?: string) {
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
      canRead: checkPermission(currentUser, 'journalissue.READ').allowed,
      canCreate: checkPermission(currentUser, 'journalissue.CREATE').allowed,
      canUpdate: false,
      canDelete: false,
    }

    // If specific issue ID is provided, check update/delete permissions
    if (issueId) {
      const issue = await prisma.journalIssue.findUnique({
        where: { id: issueId },
        include: { Article: true }
      })

      if (issue) {
        permissions.canUpdate = checkPermission(currentUser, 'journalissue.UPDATE', {
          resourceId: issue.id
        }).allowed

        permissions.canDelete = checkPermission(currentUser, 'journalissue.DELETE', {
          resourceId: issue.id
        }).allowed && issue.Article.length === 0 // Can only delete if no articles
      }
    }

    return { success: true, permissions }
  } catch (error) {
    console.error("Failed to check journal issue permissions:", error)
    return { 
      success: false, 
      error: "Failed to check permissions",
      permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
    }
  }
}

// NEW: Function to get available articles for journal issue assignment
export async function getAvailableArticlesForIssue(excludeIssueId?: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { error: "Authentication required" }
    }

    // Check if user has permission to read articles and journal issues
    const articlePermissionCheck = checkPermission(currentUser, 'article.READ')
    const issuePermissionCheck = checkPermission(currentUser, 'journalissue.READ')
    
    if (!articlePermissionCheck.allowed || !issuePermissionCheck.allowed) {
      return { 
        error: "You don't have permission to view articles or journal issues" 
      }
    }

    // Get articles that are not assigned to any issue, or assigned to the current issue being edited
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { issueId: null },
          ...(excludeIssueId ? [{ issueId: excludeIssueId }] : [])
        ],
        type: 'journal' // Only journal articles can be assigned to issues
      },
      select: {
        id: true,
        title: true,
        authors: {
          include: {
            author: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        date: true,
        issueId: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Transform for easier use in UI
    const availableArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      authors: article.authors.map(aa => aa.author.name).join(', '),
      date: article.date,
      isCurrentlyAssigned: article.issueId === excludeIssueId
    }))

    return { articles: availableArticles }
  } catch (error) {
    console.error("Failed to fetch available articles:", error)
    return { error: "Failed to fetch available articles" }
  }
}