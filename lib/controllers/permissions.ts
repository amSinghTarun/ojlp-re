// lib/controllers/permissions.ts
import prisma from "../prisma"

export async function getPermissions() {
  try {
    return await prisma.permission.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    throw new Error("Failed to fetch permissions")
  }
}

export async function getPermissionById(id: string) {
  try {
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!permission) {
      throw new Error("Permission not found")
    }

    return permission
  } catch (error) {
    console.error("Error fetching permission by ID:", error)
    throw error
  }
}

export async function createPermission(data: {
  name: string
  description?: string
}) {
  try {
    // Check if permission name already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name: data.name }
    })

    if (existingPermission) {
      throw new Error("A permission with this name already exists")
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    })

    return permission
  } catch (error) {
    console.error("Error creating permission:", error)
    throw error
  }
}

export async function updatePermission(
  id: string,
  data: {
    name?: string
    description?: string
  }
) {
  try {
    // Check if permission exists
    const existingPermission = await getPermissionById(id)

    // Check if new name already exists for another permission
    if (data.name && data.name !== existingPermission.name) {
      const nameExists = await prisma.permission.findUnique({
        where: { 
          name: data.name,
          NOT: { id }
        }
      })

      if (nameExists) {
        throw new Error("A permission with this name already exists")
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description

    // Update permission
    const updatedPermission = await prisma.permission.update({
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
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    })

    return updatedPermission
  } catch (error) {
    console.error("Error updating permission:", error)
    throw error
  }
}

export async function deletePermission(id: string) {
  try {
    // Check if permission exists and get details
    const permission = await getPermissionById(id)

    // Check if permission is assigned to any roles or users
    const roleCount = permission.roles.length
    const userCount = permission.users.length

    if (roleCount > 0 || userCount > 0) {
      throw new Error(
        `Cannot delete permission with ${roleCount} role(s) and ${userCount} user(s) assigned. Remove assignments first.`
      )
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting permission:", error)
    throw error
  }
}

// Get system-defined permissions
export function getSystemPermissions() {
  return [
    { name: "view_dashboard", description: "Access to admin dashboard" },
    { name: "manage_posts", description: "Create, edit, and delete posts" },
    { name: "manage_authors", description: "Manage author profiles" },
    { name: "manage_journals", description: "Manage journal settings" },
    { name: "manage_articles", description: "Manage journal articles" },
    { name: "manage_call_for_papers", description: "Manage call for papers" },
    { name: "manage_notifications", description: "Manage system notifications" },
    { name: "manage_media", description: "Upload and manage media files" },
    { name: "manage_editorial_board", description: "Manage editorial board members" },
    { name: "manage_board_advisors", description: "Manage board advisors" },
    { name: "manage_users", description: "Create, edit, and delete users" },
    { name: "assign_roles", description: "Assign roles to users" },
    { name: "manage_roles", description: "Create, edit, and delete roles" },
    { name: "manage_permissions", description: "Create, edit, and delete permissions" },
  ]
}

// Initialize system permissions
export async function initializeSystemPermissions() {
  try {
    const systemPermissions = getSystemPermissions()
    
    for (const permData of systemPermissions) {
      const existing = await prisma.permission.findUnique({
        where: { name: permData.name }
      })
      
      if (!existing) {
        await prisma.permission.create({
          data: permData
        })
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error initializing system permissions:", error)
    throw error
  }
}