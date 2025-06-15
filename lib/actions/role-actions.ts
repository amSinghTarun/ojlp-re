"use server"

import { revalidatePath, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"

// Role schema with validation
const RoleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

export type RoleFormData = z.infer<typeof RoleSchema>

export async function getRoles() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return {
      roles: roles.map((role) => ({
        ...role,
        // Add a flag to indicate if this is a system role (like Super Admin)
        isSystem: role.name === "Super Admin",
        // Count users with this role
        userCount: role.users.length,
        // Extract permission names
        permissionNames: role.permissions.map((p) => p.permission.name),
      })),
    }
  } catch (error) {
    console.error("Failed to fetch roles:", error)
    return { error: "Failed to fetch roles" }
  }
}

export async function getRole(id: string) {
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      return { error: "Role not found" }
    }

    return {
      role: {
        ...role,
        isSystem: role.name === "Super Admin",
        permissionNames: role.permissions.map((p) => p.permission.name),
      },
    }
  } catch (error) {
    console.error("Failed to fetch role:", error)
    return { error: "Failed to fetch role" }
  }
}

export async function createRole(formData: FormData) {
  const currentUser = await getCurrentUser()

  // Only Super Admins can create roles
  if (!currentUser || !isSuperAdmin(currentUser)) {
    return {
      success: false,
      errors: {
        _form: ["You don't have permission to create roles"],
      },
    }
  }

  const validatedFields = RoleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    permissions: formData.getAll("permissions"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, description, permissions } = validatedFields.data

  // Check if role name already exists
  const existingRole = await prisma.role.findFirst({
    where: { name },
  })

  if (existingRole) {
    return {
      success: false,
      errors: {
        name: ["A role with this name already exists"],
      },
    }
  }

  try {
    // Create the role
    const role = await prisma.role.create({
      data: {
        name,
        description: description || "",
      },
    })

    // Add permissions if provided
    if (permissions && permissions.length > 0) {
      // Get permission records
      const permissionRecords = await prisma.permission.findMany({
        where: {
          name: {
            in: permissions,
          },
        },
      })

      // Connect permissions to role
      if (permissionRecords.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionRecords.map((p) => ({
            roleId: role.id,
            permissionId: p.id,
          })),
        })
      }
    }

    revalidatePath("/admin/roles")
    redirect("/admin/roles")
  } catch (error) {
    console.error("Failed to create role:", error)
    return {
      success: false,
      errors: {
        _form: ["Failed to create role. Please try again."],
      },
    }
  }
}

export async function updateRole(id: string, formData: FormData) {
  const currentUser = await getCurrentUser()

  // Only Super Admins can update roles
  if (!currentUser || !isSuperAdmin(currentUser)) {
    return {
      success: false,
      errors: {
        _form: ["You don't have permission to update roles"],
      },
    }
  }

  // Check if this is the Super Admin role
  const role = await prisma.role.findUnique({
    where: { id },
  })

  if (!role) {
    return {
      success: false,
      errors: {
        _form: ["Role not found"],
      },
    }
  }

  // Special handling for Super Admin role
  const isSuperAdminRole = role.name === "Super Admin"

  const validatedFields = RoleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    permissions: formData.getAll("permissions"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, description, permissions } = validatedFields.data

  // For Super Admin role, don't allow name change
  if (isSuperAdminRole && name !== "Super Admin") {
    return {
      success: false,
      errors: {
        name: ["Cannot change the name of the Super Admin role"],
      },
    }
  }

  // Check if role name already exists for another role
  if (name !== role.name) {
    const existingRole = await prisma.role.findFirst({
      where: {
        name,
        id: { not: id },
      },
    })

    if (existingRole) {
      return {
        success: false,
        errors: {
          name: ["A role with this name already exists"],
        },
      }
    }
  }

  try {
    // Update the role
    await prisma.role.update({
      where: { id },
      data: {
        name,
        description: description || "",
      },
    })

    // For Super Admin, we don't update permissions - they always have all permissions
    if (!isSuperAdminRole && permissions) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      })

      // Add new permissions if provided
      if (permissions.length > 0) {
        // Get permission records
        const permissionRecords = await prisma.permission.findMany({
          where: {
            name: {
              in: permissions,
            },
          },
        })

        // Connect permissions to role
        if (permissionRecords.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissionRecords.map((p) => ({
              roleId: id,
              permissionId: p.id,
            })),
          })
        }
      }
    }

    revalidatePath("/admin/roles")
    redirect("/admin/roles")
  } catch (error) {
    console.error("Failed to update role:", error)
    return {
      success: false,
      errors: {
        _form: ["Failed to update role. Please try again."],
      },
    }
  }
}

export async function deleteRole(id: string) {
  const currentUser = await getCurrentUser()

  // Only Super Admins can delete roles
  if (!currentUser || !isSuperAdmin(currentUser)) {
    return {
      success: false,
      message: "You don't have permission to delete roles",
    }
  }

  // Check if this is the Super Admin role
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      users: true,
    },
  })

  if (!role) {
    return {
      success: false,
      message: "Role not found",
    }
  }

  // Don't allow deleting the Super Admin role
  if (role.name === "Super Admin") {
    return {
      success: false,
      message: "Cannot delete the Super Admin role",
    }
  }

  // Check if the role has users
  if (role.users.length > 0) {
    return {
      success: false,
      message: `Cannot delete role with ${role.users.length} users assigned. Reassign users first.`,
    }
  }

  try {
    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    })

    // Delete the role
    await prisma.role.delete({
      where: { id },
    })

    revalidatePath("/admin/roles")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete role:", error)
    return {
      success: false,
      message: "Failed to delete role. Please try again.",
    }
  }
}

export async function getPermissions() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return { permissions }
  } catch (error) {
    console.error("Failed to fetch permissions:", error)
    return { error: "Failed to fetch permissions" }
  }
}
