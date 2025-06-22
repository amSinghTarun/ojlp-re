import prisma from "@/lib/prisma"

export async function getRoles() {
  try {
    return await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
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
        permissions: {
          include: {
            permission: true,
          },
        },
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
  permissionIds?: string[]
}) {
  try {
    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name }
    })

    if (existingRole) {
      throw new Error("A role with this name already exists")
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description || null,
        isSystem: false,
        permissions: data.permissionIds ? {
          create: data.permissionIds.map(permissionId => ({
            permissionId
          }))
        } : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
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
    permissionIds?: string[]
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

    // Update role permissions if provided and not a system role
    if (data.permissionIds !== undefined && !existingRole.isSystem) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      })

      // Add new permissions
      if (data.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: data.permissionIds.map(permissionId => ({
            roleId: id,
            permissionId
          }))
        })
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
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

    // Delete role (permissions will be deleted via cascade)
    await prisma.role.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting role:", error)
    throw error
  }
}

export async function getPermissions() {
  try {
    return await prisma.permission.findMany({
      orderBy: {
        name: "asc",
      },
    })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    throw new Error("Failed to fetch permissions")
  }
}

export async function createPermission(data: {
  name: string
  description?: string
}) {
  try {
    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name: data.name }
    })

    if (existingPermission) {
      throw new Error("A permission with this name already exists")
    }

    const permission = await prisma.permission.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
    })

    return permission
  } catch (error) {
    console.error("Error creating permission:", error)
    throw error
  }
}