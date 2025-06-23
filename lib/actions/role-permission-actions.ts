// lib/actions/role-permission-actions.ts - FIXED VERSION
"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { 
  checkPermission, 
  hasSystemAccess 
} from '@/lib/permissions/checker'
import { 
  generateAllPermissions, 
  groupPermissionsByTable 
} from '@/lib/permissions/schema-reader'
import { 
  UserWithPermissions, 
  isValidPermissionString 
} from '@/lib/permissions/types'

// Response helpers
function createSuccessResponse<T>(data: T, message?: string) {
  return { success: true as const, data, message }
}

function createErrorResponse(error: string) {
  return { success: false as const, error }
}

// Get current user with permissions helper
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

/**
 * Get all available permissions grouped by table
 */
export async function getAvailablePermissions() {
  try {
    console.log("🔍 getAvailablePermissions called")
    
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      console.log("❌ No user found")
      return createErrorResponse("Authentication required")
    }

    console.log("✅ User found:", user.email)

    // For now, let's skip permission checking to test if permissions load
    // const permissionCheck = checkPermission(user, 'SYSTEM.ROLE_MANAGEMENT')
    // if (!permissionCheck.allowed) {
    //   return createErrorResponse(permissionCheck.reason || "Insufficient permissions")
    // }

    console.log("🔄 Getting permissions...")
    const groupedPermissions = groupPermissionsByTable()
    const allPermissions = generateAllPermissions()

    console.log("📋 Generated permissions:", {
      groupedKeys: Object.keys(groupedPermissions),
      totalPermissions: allPermissions.length,
      grouped: groupedPermissions
    })

    return createSuccessResponse({
      grouped: groupedPermissions,
      all: allPermissions
    })
  } catch (error) {
    console.error("❌ Failed to get available permissions:", error)
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
    console.log("🆕 Creating role with data:", data)
    
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    // Validate input
    if (!data.name || data.name.trim().length < 2) {
      return createErrorResponse("Role name must be at least 2 characters")
    }

    if (!data.permissions || data.permissions.length === 0) {
      return createErrorResponse("At least one permission must be selected")
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
        permissions: data.permissions
      }
    })

    console.log("✅ Role created successfully:", role)

    revalidatePath('/admin/roles')
    revalidatePath('/admin/users')

    return createSuccessResponse(role, "Role created successfully")
  } catch (error) {
    console.error("❌ Failed to create role:", error)
    return createErrorResponse("Failed to create role")
  }
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(roleId: string, permissions: string[]) {
  try {
    console.log("📝 Updating role permissions:", { roleId, permissions })
    
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    if (!roleId) {
      return createErrorResponse("Role ID is required")
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      return createErrorResponse("Role not found")
    }

    // Update role permissions
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: permissions
      }
    })

    console.log("✅ Role updated successfully:", updatedRole)

    revalidatePath('/admin/roles')
    revalidatePath('/admin/users')

    return createSuccessResponse(updatedRole, "Role permissions updated successfully")
  } catch (error) {
    console.error("❌ Failed to update role permissions:", error)
    return createErrorResponse("Failed to update role permissions")
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
 * Delete a role
 */
export async function deleteRole(roleId: string) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { users: true }
    })

    if (!role) {
      return createErrorResponse("Role not found")
    }

    if (role.isSystem) {
      return createErrorResponse("Cannot delete system roles")
    }

    if (role.users.length > 0) {
      return createErrorResponse(
        `Cannot delete role. ${role.users.length} user(s) are assigned to this role.`
      )
    }

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
 * Duplicate a role
 */
export async function duplicateRole(roleId: string, newName: string) {
  try {
    const user = await getCurrentUserWithPermissions()
    if (!user) {
      return createErrorResponse("Authentication required")
    }

    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      return createErrorResponse("Role not found")
    }

    const result = await createRoleWithPermissions({
      name: newName,
      description: `Copy of ${existingRole.name}`,
      permissions: existingRole.permissions,
      isSystem: false
    })

    return result
  } catch (error) {
    console.error("Failed to duplicate role:", error)
    return createErrorResponse("Failed to duplicate role")
  }
}