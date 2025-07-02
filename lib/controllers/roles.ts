// lib/controllers/roles.ts - Updated for simplified schema
import prisma from "@/lib/prisma"

export async function getRoles() {
  try {
    return await prisma.role.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })
  } catch (error) {
    console.error("Error fetching roles:", error)
    throw new Error("Failed to fetch roles")
  }
}

export async function getRoleById(id: string) {
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!role) {
      throw new Error("Role not found")
    }

    return role
  } catch (error) {
    console.error("Error fetching role by ID:", error)
    throw error
  }
}

export async function createRole(data: {
  name: string
  description?: string
  permissions?: string[]
  isSystem?: boolean
}) {
  try {
    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name }
    })

    if (existingRole) {
      throw new Error("A role with this name already exists")
    }

    // Create role with permissions array
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description || null,
        isSystem: data.isSystem || false,
        permissions: data.permissions || [], // Direct permissions array
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return role
  } catch (error) {
    console.error("Error creating role:", error)
    throw error
  }
}

export async function updateRole(
  id: string,
  data: {
    name?: string
    description?: string
    permissions?: string[]
  }
) {
  try {
    // Check if role exists
    const existingRole = await getRoleById(id)

    // Prevent modifying system roles' core properties
    if (existingRole.isSystem && data.name && data.name !== existingRole.name) {
      throw new Error("Cannot change the name of system roles")
    }

    // Check if new name already exists for another role
    if (data.name && data.name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { 
          name: data.name,
          NOT: { id }
        }
      })

      if (nameExists) {
        throw new Error("A role with this name already exists")
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.permissions !== undefined) updateData.permissions = data.permissions

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return updatedRole
  } catch (error) {
    console.error("Error updating role:", error)
    throw error
  }
}

export async function deleteRole(id: string) {
  try {
    // Check if role exists and get details
    const role = await getRoleById(id)

    // Prevent deletion of system roles
    if (role.isSystem) {
      throw new Error("Cannot delete system roles")
    }

    // Check if role has users assigned
    if (role.users.length > 0) {
      throw new Error(`Cannot delete role with ${role.users.length} users assigned. Reassign users first.`)
    }

    // Delete role
    await prisma.role.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting role:", error)
    throw error
  }
}

export async function duplicateRole(sourceRoleId: string, newName: string) {
  try {
    // Get the source role
    const sourceRole = await getRoleById(sourceRoleId)

    // Check if new name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: newName }
    })

    if (existingRole) {
      throw new Error("A role with this name already exists")
    }

    // Create duplicate role
    const duplicatedRole = await prisma.role.create({
      data: {
        name: newName,
        description: sourceRole.description ? `${sourceRole.description} (Copy)` : null,
        isSystem: false, // Duplicated roles are never system roles
        permissions: [...sourceRole.permissions], // Copy permissions array
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return duplicatedRole
  } catch (error) {
    console.error("Error duplicating role:", error)
    throw error
  }
}

// Helper function to get available permissions (hardcoded for your schema)
export function getAvailablePermissions() {
  return {
    "System": [
      {
        value: "SYSTEM.ADMIN",
        label: "System Administrator",
        description: "Full system access (bypasses all other permissions)",
        category: "System"
      },
      {
        value: "SYSTEM.USER_MANAGEMENT",
        label: "User Management",
        description: "Manage users and their permissions",
        category: "System"
      },
      {
        value: "SYSTEM.ROLE_MANAGEMENT",
        label: "Role Management",
        description: "Create and manage roles and permissions",
        category: "System"
      },
    ],
    "User": [
      {
        value: "user.CREATE",
        label: "Create Users",
        description: "Create new user accounts",
        category: "User"
      },
      {
        value: "user.READ",
        label: "View Users",
        description: "View user information",
        category: "User"
      },
      {
        value: "user.UPDATE",
        label: "Edit Users",
        description: "Edit existing user accounts",
        category: "User"
      },
      {
        value: "user.DELETE",
        label: "Delete Users",
        description: "Delete user accounts",
        category: "User"
      },
      {
        value: "user.ALL",
        label: "All User Operations",
        description: "Full access to user management",
        category: "User"
      }
    ],
    "Role": [
      {
        value: "role.CREATE",
        label: "Create Roles",
        description: "Create new roles",
        category: "Role"
      },
      {
        value: "role.READ",
        label: "View Roles",
        description: "View role information",
        category: "Role"
      },
      {
        value: "role.UPDATE",
        label: "Edit Roles",
        description: "Edit existing roles",
        category: "Role"
      },
      {
        value: "role.DELETE",
        label: "Delete Roles",
        description: "Delete roles",
        category: "Role"
      },
      {
        value: "role.ALL",
        label: "All Role Operations",
        description: "Full access to role management",
        category: "Role"
      }
    ],
    "Article": [
      {
        value: "article.CREATE",
        label: "Create Articles",
        description: "Create new articles",
        category: "Article"
      },
      {
        value: "article.READ",
        label: "View Articles",
        description: "View articles",
        category: "Article"
      },
      {
        value: "article.UPDATE",
        label: "Edit Articles",
        description: "Edit existing articles",
        category: "Article"
      },
      {
        value: "article.DELETE",
        label: "Delete Articles",
        description: "Delete articles",
        category: "Article"
      },
      {
        value: "article.ALL",
        label: "All Article Operations",
        description: "Full access to article management",
        category: "Article"
      }
    ],
    "Author": [
      {
        value: "author.CREATE",
        label: "Create Authors",
        description: "Create new author profiles",
        category: "Author"
      },
      {
        value: "author.READ",
        label: "View Authors",
        description: "View author information",
        category: "Author"
      },
      {
        value: "author.UPDATE",
        label: "Edit Authors",
        description: "Edit existing author profiles",
        category: "Author"
      },
      {
        value: "author.DELETE",
        label: "Delete Authors",
        description: "Delete author profiles",
        category: "Author"
      },
      {
        value: "author.ALL",
        label: "All Author Operations",
        description: "Full access to author management",
        category: "Author"
      }
    ],
    "CallForPapers": [
      {
        value: "callforpapers.CREATE",
        label: "Create Call for Papers",
        description: "Create new call for papers",
        category: "CallForPapers"
      },
      {
        value: "callforpapers.READ",
        label: "View Call for Papers",
        description: "View call for papers",
        category: "CallForPapers"
      },
      {
        value: "callforpapers.UPDATE",
        label: "Edit Call for Papers",
        description: "Edit existing call for papers",
        category: "CallForPapers"
      },
      {
        value: "callforpapers.DELETE",
        label: "Delete Call for Papers",
        description: "Delete call for papers",
        category: "CallForPapers"
      },
      {
        value: "callforpapers.ALL",
        label: "All Call for Papers Operations",
        description: "Full access to call for papers management",
        category: "CallForPapers"
      }
    ],
    "JournalIssue": [
      {
        value: "journalissue.CREATE",
        label: "Create Journal Issues",
        description: "Create new journal issues",
        category: "JournalIssue"
      },
      {
        value: "journalissue.READ",
        label: "View Journal Issues",
        description: "View journal issues",
        category: "JournalIssue"
      },
      {
        value: "journalissue.UPDATE",
        label: "Edit Journal Issues",
        description: "Edit existing journal issues",
        category: "JournalIssue"
      },
      {
        value: "journalissue.DELETE",
        label: "Delete Journal Issues",
        description: "Delete journal issues",
        category: "JournalIssue"
      },
      {
        value: "journalissue.ALL",
        label: "All Journal Issue Operations",
        description: "Full access to journal issue management",
        category: "JournalIssue"
      }
    ],
    "EditorialBoardMember": [
      {
        value: "editorialboardmember.CREATE",
        label: "Add Board Members",
        description: "Add new editorial board members",
        category: "EditorialBoardMember"
      },
      {
        value: "editorialboardmember.READ",
        label: "View Board Members",
        description: "View editorial board members",
        category: "EditorialBoardMember"
      },
      {
        value: "editorialboardmember.UPDATE",
        label: "Edit Board Members",
        description: "Edit editorial board member information",
        category: "EditorialBoardMember"
      },
      {
        value: "editorialboardmember.DELETE",
        label: "Remove Board Members",
        description: "Remove editorial board members",
        category: "EditorialBoardMember"
      },
      {
        value: "editorialboardmember.ALL",
        label: "All Board Member Operations",
        description: "Full access to editorial board management",
        category: "EditorialBoardMember"
      }
    ],
    "Media": [
      {
        value: "media.CREATE",
        label: "Upload Media",
        description: "Upload new media files",
        category: "Media"
      },
      {
        value: "media.READ",
        label: "View Media",
        description: "View media files",
        category: "Media"
      },
      {
        value: "media.UPDATE",
        label: "Edit Media",
        description: "Edit media information",
        category: "Media"
      },
      {
        value: "media.DELETE",
        label: "Delete Media",
        description: "Delete media files",
        category: "Media"
      },
      {
        value: "media.ALL",
        label: "All Media Operations",
        description: "Full access to media management",
        category: "Media"
      }
    ],
    "Notification": [
      {
        value: "notification.CREATE",
        label: "Create Notifications",
        description: "Create new system notifications",
        category: "Notification"
      },
      {
        value: "notification.READ",
        label: "View Notifications",
        description: "View system notifications",
        category: "Notification"
      },
      {
        value: "notification.UPDATE",
        label: "Edit Notifications",
        description: "Edit existing notifications",
        category: "Notification"
      },
      {
        value: "notification.DELETE",
        label: "Delete Notifications",
        description: "Delete system notifications",
        category: "Notification"
      },
      {
        value: "notification.ALL",
        label: "All Notification Operations",
        description: "Full access to notification management",
        category: "Notification"
      }
    ]
  }
}