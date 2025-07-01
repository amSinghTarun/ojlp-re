"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { prisma } from "@/lib/prisma"
import { getAuthors, getAuthorBySlug, createAuthor, updateAuthor, deleteAuthor } from "../controllers/authors"
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

const authorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  title: z.string().optional(),
  bio: z.string().optional(),
  image: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      email: z.string().email().optional(),
      orcid: z.string().optional(),
    })
    .optional(),
  userId: z.string().optional(),
})

export async function getAuthorsList() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read authors
    const permissionCheck = checkPermission(currentUser, 'author.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to view authors" 
      }
    }

    const authors = await getAuthors()
    console.log(`✅ User ${currentUser.email} fetched ${authors.length} authors`)
    
    return { success: true, data: authors }
  } catch (error) {
    console.error("Failed to fetch authors:", error)
    return { success: false, error: "Failed to fetch authors" }
  }
}

export async function getAuthorDetail(slug: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read authors
    const permissionCheck = checkPermission(currentUser, 'author.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to view author details" 
      }
    }

    const author = await getAuthorBySlug(slug)
    if (!author) {
      return { success: false, error: "Author not found" }
    }

    console.log(`✅ User ${currentUser.email} viewed author: ${author.name}`)
    
    return { success: true, data: author }
  } catch (error) {
    console.error(`Failed to fetch author ${slug}:`, error)
    return { success: false, error: "Failed to fetch author" }
  }
}

export async function createNewAuthor(data: z.infer<typeof authorSchema>) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create authors
    const permissionCheck = checkPermission(currentUser, 'author.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to create authors" 
      }
    }

    // Validate input data
    const validatedData = authorSchema.parse(data)

    // Additional permission check: Only admins can assign authors to other users
    if (validatedData.userId && validatedData.userId !== currentUser.id) {
      const adminPermissionCheck = checkPermission(currentUser, 'user.UPDATE')
      if (!adminPermissionCheck.allowed) {
        return { 
          success: false, 
          error: "You can only create author profiles for yourself" 
        }
      }
    }

    // Check for duplicate email
    const existingAuthor = await prisma.author.findUnique({
      where: { email: validatedData.email }
    })

    if (existingAuthor) {
      return { 
        success: false, 
        error: "An author with this email already exists" 
      }
    }

    const author = await createAuthor(validatedData)
    
    console.log(`✅ User ${currentUser.email} created author: ${author.name}`)
    
    revalidatePath("/admin/authors")
    revalidatePath("/authors")
    
    return { success: true, data: author }
  } catch (error) {
    console.error("Failed to create author:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to create author" }
  }
}

export async function updateExistingAuthor(slug: string, data: Partial<z.infer<typeof authorSchema>>) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Get the existing author to check ownership
    const existingAuthor = await prisma.author.findUnique({
      where: { slug }
    })

    if (!existingAuthor) {
      return { success: false, error: "Author not found" }
    }

    // Check if user has permission to update authors
    const isOwner = existingAuthor.userId === currentUser.id
    
    const permissionCheck = checkPermission(currentUser, 'author.UPDATE')

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to update this author" 
      }
    }

    // Additional validation for email changes
    if (data.email && data.email !== existingAuthor.email) {
      const duplicateEmail = await prisma.author.findUnique({
        where: { email: data.email }
      })

      if (duplicateEmail) {
        return { 
          success: false, 
          error: "An author with this email already exists" 
        }
      }
    }

    // Additional permission check: Only admins can change author ownership
    if (data.userId && data.userId !== existingAuthor.userId) {
      const adminPermissionCheck = checkPermission(currentUser, 'user.UPDATE')
      if (!adminPermissionCheck.allowed) {
        return { 
          success: false, 
          error: "You don't have permission to change author ownership" 
        }
      }
    }

    const author = await updateAuthor(slug, data)
    
    console.log(`✅ User ${currentUser.email} updated author: ${author.name}`)
    
    revalidatePath("/admin/authors")
    revalidatePath(`/authors/${slug}`)
    revalidatePath(`/authors/${author.slug}`)
    
    return { success: true, data: author }
  } catch (error) {
    console.error(`Failed to update author ${slug}:`, error)
    return { success: false, error: "Failed to update author" }
  }
}

export async function deleteExistingAuthor(slug: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Get the existing author to check ownership and dependencies
    const existingAuthor = await prisma.author.findUnique({
      where: { slug },
      include: {
        authorArticles: {
          select: {
            id: true,
            article: {
              select: {
                title: true,
                slug: true
              }
            }
          }
        }
      }
    })

    if (!existingAuthor) {
      return { success: false, error: "Author not found" }
    }

    // Check if author has articles (prevent deletion if they do)
    if (existingAuthor.authorArticles && existingAuthor.authorArticles.length > 0) {
      return { 
        success: false, 
        error: `Cannot delete author with ${existingAuthor.authorArticles.length} associated article(s). Please reassign or remove articles first.` 
      }
    }

    // Check if user has permission to delete authors
    const isOwner = existingAuthor.userId === currentUser.id
    
    const permissionCheck = checkPermission(currentUser, 'author.DELETE')

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to delete this author" 
      }
    }

    await deleteAuthor(slug)
    
    console.log(`✅ User ${currentUser.email} deleted author: ${existingAuthor.name}`)
    
    revalidatePath("/admin/authors")
    revalidatePath("/authors")
    
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete author ${slug}:`, error)
    return { success: false, error: "Failed to delete author" }
  }
}

// NEW: Function to get authors that the current user can manage
export async function getManageableAuthors() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read authors
    const permissionCheck = checkPermission(currentUser, 'author.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: "You don't have permission to view authors" 
      }
    }

    const allAuthors = await getAuthors()
    
    // Filter authors based on what user can manage
    const manageableAuthors = allAuthors.map(author => ({
      ...author,
      canEdit: checkPermission(currentUser, 'author.UPDATE').allowed,
      canDelete: checkPermission(currentUser, 'author.DELETE').allowed,
    }))

    return { 
      success: true, 
      data: manageableAuthors,
      canCreate: checkPermission(currentUser, 'author.CREATE').allowed
    }
  } catch (error) {
    console.error("Failed to fetch manageable authors:", error)
    return { success: false, error: "Failed to fetch authors" }
  }
}

// NEW: Function to check if current user can perform specific author actions
export async function checkAuthorPermissions(slug?: string) {
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
      canRead: checkPermission(currentUser, 'author.READ').allowed,
      canCreate: checkPermission(currentUser, 'author.CREATE').allowed,
      canUpdate: false,
      canDelete: false,
    }

    // If specific author slug is provided, check update/delete permissions
    if (slug) {
      const author = await prisma.author.findUnique({
        where: { slug }
      })

      if (author) {
        const isOwner = author.userId === currentUser.id
        
        permissions.canUpdate = checkPermission(currentUser, 'author.UPDATE').allowed

        permissions.canDelete = checkPermission(currentUser, 'author.DELETE').allowed
      }
    }

    return { success: true, permissions }
  } catch (error) {
    console.error("Failed to check author permissions:", error)
    return { 
      success: false, 
      error: "Failed to check permissions",
      permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
    }
  }
}