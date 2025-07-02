// lib/actions/journal-actions.ts - Updated for actual schema
"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { prisma } from "@/lib/prisma"
import { 
  getJournalIssues as getJournalIssuesController,
  getJournalIssueById,
  createJournalIssue as createJournalIssueController,
  updateJournalIssue as updateJournalIssueController,
  deleteJournalIssue as deleteJournalIssueController
} from "../controllers/journal-issues"
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

// Updated schema to match actual JournalIssue model
const journalIssueSchema = z.object({
  volume: z.coerce.number().min(1, "Volume must be at least 1"),
  theme: z.string().optional(),
  issue: z.coerce.number().min(1, "Issue must be at least 1"),
  year: z.coerce.number().min(1900, "Year must be valid"),
  publishDate: z.string().optional(),
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

    const issues = await getJournalIssuesController()

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

    const issue = await getJournalIssueById(id)

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

    const issue = await createJournalIssueController(validatedData)

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
    const existingIssue = await getJournalIssueById(id)

    if (!existingIssue) {
      return { error: "Journal issue not found" }
    }

    // Check if user has permission to update journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.UPDATE')

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

    const issue = await updateJournalIssueController(id, validatedData)

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
    const existingIssue = await getJournalIssueById(id)

    if (!existingIssue) {
      return { error: "Journal issue not found" }
    }

    // Check if user has permission to delete journal issues
    const permissionCheck = checkPermission(currentUser, 'journalissue.DELETE')

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

    // Delete the issue
    await deleteJournalIssueController(id)

    console.log(`✅ User ${currentUser.email} deleted journal issue: Volume ${existingIssue.volume}, Issue ${existingIssue.issue} (${existingIssue.year})`)

    revalidatePath("/admin/journals")
    revalidatePath("/journals")
    
    return { success: true }
  } catch (error) {
    console.error("Failed to delete journal issue:", error)
    return { error: "Failed to delete journal issue" }
  }
}

// Function to get journal issues with permission context
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

    const issues = await getJournalIssuesController()

    // Add permission context to each issue
    const issuesWithPermissions = issues.map(issue => ({
      ...issue,
      canEdit: checkPermission(currentUser, 'journalissue.UPDATE').allowed,
      canDelete: checkPermission(currentUser, 'journalissue.DELETE').allowed && issue.Article.length === 0,
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

// Function to check journal issue permissions
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
      canUpdate: checkPermission(currentUser, 'journalissue.UPDATE').allowed,
      canDelete: checkPermission(currentUser, 'journalissue.DELETE').allowed,
    }

    // If specific issue ID is provided, check if it has articles (affects delete permission)
    if (issueId && permissions.canDelete) {
      const issue = await getJournalIssueById(issueId)
      if (issue && issue.Article.length > 0) {
        permissions.canDelete = false // Can't delete if has articles
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

// Function to get available articles for journal issue assignment
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
        publishedAt: true,
        issueId: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    // Transform for easier use in UI
    const availableArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      authors: article.authors.map(aa => aa.author.name).join(', '),
      publishedAt: article.publishedAt,
      isCurrentlyAssigned: article.issueId === excludeIssueId
    }))

    return { articles: availableArticles }
  } catch (error) {
    console.error("Failed to fetch available articles:", error)
    return { error: "Failed to fetch available articles" }
  }
}