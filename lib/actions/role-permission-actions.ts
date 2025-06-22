// lib/actions/role-permissions-actions.ts - Simplified for array-based permissions
"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { 
  checkPermission, 
  hasSystemAccess,
  getAllUserPermissions 
} from '@/lib/permissions/checker'
import { 
  generateAllPermissions, 
  groupPermissionsByTable 
} from '@/lib/permissions/schema-reader'
import { 
  UserWithPermissions, 
  SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  isValidPermissionString 
} from '@/lib/permissions/types'

// Response helpers
function createSuccessResponse<T>(data: T, message?: string) {
  return { success: true as const, data, message }
}

function createErrorResponse(error: string) {
  return { success: false as const, error }
}

/**
 * Get all available permissions grouped by table
 */
export async function getAvailablePermissions() {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Check if user can manage roles
    const permissionCheck = checkPermission(user, 'SYSTEM.ROLE_MANAGEMENT')
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || "Insufficient permissions")
    }

    const groupedPermissions = groupPermissionsByTable()
    const allPermissions = generateAllPermissions()

    return createSuccessResponse({
      grouped: groupedPermissions,
      all: allPermissions
    })
  } catch (error) {
    console.error("Failed to get available permissions:", error)
    return createErrorResponse("Failed to load permissions")
  }
}

/**
 * Create a new role with permissions
 */
export async function createRoleWithPermissions(data: {
  name: string
  description?: string
  permissions: string[]
  isSystem?: boolean
}) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Check permissions
    const permissionCheck = checkPermission(user, 'SYSTEM.ROLE_MANAGEMENT')
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || "Insufficient permissions")
    }

    // Validate input
    if (!data.name || data.name.trim().length < 2) {
      return createErrorResponse("Role name must be at least 2 characters")
    }

    if (!data.permissions || data.permissions.length === 0) {
      return createErrorResponse("At least one permission must be selected")
    }

    // Validate permission strings
    const invalidPermissions = data.permissions.filter(p => !isValidPermissionString(p))
    if (invalidPermissions.length > 0) {
      return createErrorResponse(`Invalid permissions: ${invalidPermissions.join(', ')}`)
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name.trim() }
    })

    if (existingRole) {
      return createErrorResponse("A role with this name already exists")
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        isSystem: data.isSystem || false,
        permissions: data.permissions // Store as array directly
      }
    })

    revalidatePath('/admin/roles')
    revalidatePath('/admin/users')

    return createSuccessResponse(role, "Role created successfully")
  } catch (error) {
    console.error("Failed to create role:", error)
    return createErrorResponse("Failed to create role")
  }
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(roleId: string, permissions: string[]) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Check permissions
    const permissionCheck = checkPermission(user, 'SYSTEM.ROLE_MANAGEMENT')
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || "Insufficient permissions")
    }

    // Validate input
    if (!roleId) {
      return createErrorResponse("Role ID is required")
    }

    // Validate permission strings
    const invalidPermissions = permissions.filter(p => !isValidPermissionString(p))
    if (invalidPermissions.length > 0) {
      return createErrorResponse(`Invalid permissions: ${invalidPermissions.join(', ')}`)
    }

    // Check if role exists and is not system role (unless user is super admin)
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      return createErrorResponse("Role not found")
    }

    if (existingRole.isSystem && !hasSystemAccess(user, 'ADMIN')) {
      return createErrorResponse("Cannot modify system roles")
    }

    // Update role permissions
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: permissions // Update array directly
      }
    })

    revalidatePath('/admin/roles')
    revalidatePath('/admin/users')

    return createSuccessResponse(updatedRole, "Role permissions updated successfully")
  } catch (error) {
    console.error("Failed to update role permissions:", error)
    return createErrorResponse("Failed to update role permissions")
  }
}

/**
 * Assign permissions directly to a user (overrides role permissions)
 */
export async function updateUserPermissions(userId: string, permissions: string[]) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Check permissions - user management required
    const permissionCheck = checkPermission(user, 'SYSTEM.USER_MANAGEMENT')
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || "Insufficient permissions")
    }

    // Validate permission strings
    const invalidPermissions = permissions.filter(p => !isValidPermissionString(p))
    if (invalidPermissions.length > 0) {
      return createErrorResponse(`Invalid permissions: ${invalidPermissions.join(', ')}`)
    }

    // Update user permissions
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        permissions: permissions // Update array directly
      },
      include: {
        role: true
      }
    })

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)

    return createSuccessResponse(updatedUser, "User permissions updated successfully")
  } catch (error) {
    console.error("Failed to update user permissions:", error)
    return createErrorResponse("Failed to update user permissions")
  }
}

/**
 * Create default roles with predefined permissions
 */
export async function createDefaultRoles() {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Only super admin can create default roles
    if (!hasSystemAccess(user, 'ADMIN')) {
      return createErrorResponse("System administrator privileges required")
    }

    const createdRoles = []

    for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      try {
        // Check if role already exists
        const existingRole = await prisma.role.findUnique({
          where: { name: roleName }
        })

        if (existingRole) {
          console.log(`Role ${roleName} already exists, skipping...`)
          continue
        }

        // Create role with permissions
        const result = await createRoleWithPermissions({
          name: roleName,
          description: `Default ${roleName.toLowerCase()} role`,
          permissions: permissions as string[],
          isSystem: true
        })

        if (result.success) {
          createdRoles.push(result.data)
        }
      } catch (error) {
        console.error(`Failed to create role ${roleName}:`, error)
      }
    }

    return createSuccessResponse(
      createdRoles, 
      `Created ${createdRoles.length} default roles`
    )
  } catch (error) {
    console.error("Failed to create default roles:", error)
    return createErrorResponse("Failed to create default roles")
  }
}

/**
 * Get all roles with their permissions
 */
export async function getRolesWithPermissions() {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    const roles = await prisma.role.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    })

    return createSuccessResponse(roles)
  } catch (error) {
    console.error("Failed to get roles:", error)
    return createErrorResponse("Failed to load roles")
  }
}

/**
 * Get a single role by ID
 */
export async function getRoleById(roleId: string) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!role) {
      return createErrorResponse("Role not found")
    }

    return createSuccessResponse(role)
  } catch (error) {
    console.error("Failed to get role:", error)
    return createErrorResponse("Failed to load role")
  }
}

/**
 * Delete a role (with safety checks)
 */
export async function deleteRole(roleId: string) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Check permissions
    const permissionCheck = checkPermission(user, 'SYSTEM.ROLE_MANAGEMENT')
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || "Insufficient permissions")
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: true
      }
    })

    if (!role) {
      return createErrorResponse("Role not found")
    }

    // Prevent deletion of system roles (unless super admin)
    if (role.isSystem && !hasSystemAccess(user, 'ADMIN')) {
      return createErrorResponse("Cannot delete system roles")
    }

    // Prevent deletion if role has users assigned
    if (role.users.length > 0) {
      return createErrorResponse(
        `Cannot delete role. ${role.users.length} user(s) are assigned to this role.`
      )
    }

    // Delete role
    await prisma.role.delete({
      where: { id: roleId }
    })

    revalidatePath('/admin/roles')
    revalidatePath('/admin/users')

    return createSuccessResponse(null, "Role deleted successfully")
  } catch (error) {
    console.error("Failed to delete role:", error)
    return createErrorResponse("Failed to delete role")
  }
}

/**
 * Duplicate a role with new name
 */
export async function duplicateRole(roleId: string, newName: string) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Check permissions
    const permissionCheck = checkPermission(user, 'SYSTEM.ROLE_MANAGEMENT')
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || "Insufficient permissions")
    }

    // Get existing role
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      return createErrorResponse("Role not found")
    }

    // Create duplicate role
    const result = await createRoleWithPermissions({
      name: newName,
      description: `Copy of ${existingRole.name}`,
      permissions: existingRole.permissions,
      isSystem: false // Duplicates are never system roles
    })

    return result
  } catch (error) {
    console.error("Failed to duplicate role:", error)
    return createErrorResponse("Failed to duplicate role")
  }
}

/**
 * Get user permissions summary
 */
export async function getUserPermissionsSummary(userId: string) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Check permissions
    const permissionCheck = checkPermission(user, 'SYSTEM.USER_MANAGEMENT')
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || "Insufficient permissions")
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      }
    }) as UserWithPermissions

    if (!targetUser) {
      return createErrorResponse("User not found")
    }

    const allPermissions = getAllUserPermissions(targetUser)
    const rolePermissions = targetUser.role.permissions || []
    const directPermissions = targetUser.permissions || []

    return createSuccessResponse({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email
      },
      role: {
        id: targetUser.role.id,
        name: targetUser.role.name,
        permissions: rolePermissions
      },
      directPermissions,
      allPermissions,
      permissionCount: allPermissions.length
    })
  } catch (error) {
    console.error("Failed to get user permissions:", error)
    return createErrorResponse("Failed to get user permissions")
  }
}

// Helper functions

async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  const user = await getCurrentUser()
  if (!user) return null

  return await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      role: true
    }
  }) as UserWithPermissions
}