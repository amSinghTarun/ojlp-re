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

export async function createArticle(data: {
  title: string
  content: string
  excerpt?: string
  type: "blog" | "journal"
  image?: string
  authorIds: string[]
  categoryIds?: string[]
  featured?: boolean
  doi?: string
  keywords?: string[]
  journalIssueId?: string
}) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    const permissionCheck = checkPermission(currentUser, 'article.CREATE')
    if (!permissionCheck.allowed) {
      return { success: false, error: "You don't have permission to create articles" }
    }

    // TODO: Implement actual article creation with Prisma
    // const article = await prisma.article.create({ ... })

    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article: null } // Replace with actual article
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
    excerpt?: string
    image?: string
    authorIds?: string[]
    categoryIds?: string[]
    featured?: boolean
    doi?: string
    keywords?: string[]
    journalIssueId?: string | null
    type?: "blog" | "journal"
  },
) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    const permissionCheck = checkPermission(currentUser, 'article.UPDATE')
    if (!permissionCheck.allowed) {
      return { success: false, error: "You don't have permission to update articles" }
    }

    // TODO: Implement actual article update with Prisma
    // const article = await prisma.article.update({ ... })

    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article: null } // Replace with actual article
  } catch (error) {
    console.error("Error updating article:", error)
    return { success: false, error: "Failed to update article" }
  }
}

export async function deleteArticle(slug: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    const permissionCheck = checkPermission(currentUser, 'article.DELETE')
    if (!permissionCheck.allowed) {
      return { success: false, error: "You don't have permission to delete articles" }
    }

    // TODO: Implement actual article deletion with Prisma
    // await prisma.article.delete({ ... })

    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true }
  } catch (error) {
    console.error("Error deleting article:", error)
    return { success: false, error: "Failed to delete article" }
  }
}