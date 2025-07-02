// lib/actions/role-actions.ts - Updated bridge layer for simplified schema
"use server"

import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { prisma } from "@/lib/prisma"
import { 
  getRolesWithPermissions, 
  getRoleById, 
  createRoleWithPermissions,
  updateRolePermissions,
  deleteRole,
  duplicateRole,
  getAvailablePermissions
} from './role-permission-actions'

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

/**
 * Get all roles (bridge function)
 */
export async function getRoles() {
  try {
    console.log("🔄 getRoles bridge called")
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { roles: null, error: "Authentication required" }
    }

    // Check if user has permission to read roles
    const permissionCheck = checkPermission(currentUser, 'role.READ')
    if (!permissionCheck.allowed) {
      console.log(`❌ User ${currentUser.email} denied access to read roles:`, permissionCheck.reason)
      return { 
        roles: null, 
        error: permissionCheck.reason || "You don't have permission to view roles" 
      }
    }

    const result = await getRolesWithPermissions()
    
    if (!result.success) {
      console.log("❌ getRolesWithPermissions failed:", result.error)
      return { roles: null, error: result.error }
    }

    const rolesWithCounts = result.data.map(role => ({
      ...role,
      userCount: role.users?.length || 0,
      isSystemRole: role.isSystem || false
    }))

    console.log(`✅ User ${currentUser.email} fetched ${rolesWithCounts.length} roles`)
    return { roles: rolesWithCounts, error: null }
  } catch (error) {
    console.error("❌ getRoles bridge error:", error)
    return { 
      roles: null, 
      error: error instanceof Error ? error.message : "Failed to fetch roles" 
    }
  }
}

/**
 * Get single role by ID (bridge function)
 */
export async function getRole(roleId: string) {
  try {
    console.log("🔄 getRole bridge called for:", roleId)
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { role: null, error: "Authentication required" }
    }

    // Check if user has permission to read roles
    const permissionCheck = checkPermission(currentUser, 'role.READ')
    if (!permissionCheck.allowed) {
      console.log(`❌ User ${currentUser.email} denied access to read role ${roleId}:`, permissionCheck.reason)
      return { 
        role: null, 
        error: permissionCheck.reason || "You don't have permission to view role details" 
      }
    }

    if (!roleId || typeof roleId !== 'string') {
      return { role: null, error: "Invalid role ID provided" }
    }

    const result = await getRoleById(roleId)
    
    if (!result.success) {
      console.log("❌ getRoleById failed:", result.error)
      return { role: null, error: result.error }
    }

    const role = {
      ...result.data,
      userCount: result.data.users?.length || 0,
      isSystemRole: result.data.isSystem || false
    }

    console.log(`✅ User ${currentUser.email} fetched role: ${role.name}`)
    return { role, error: null }
  } catch (error) {
    console.error("❌ getRole bridge error:", error)
    return { 
      role: null, 
      error: error instanceof Error ? error.message : "Failed to fetch role" 
    }
  }
}

/**
 * Get available permissions (bridge function)
 */
export async function getPermissions() {
  try {
    console.log("🔄 getPermissions bridge called")
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { permissions: null, error: "Authentication required" }
    }

    // Check if user has permission to read roles (permissions are part of role management)
    const permissionCheck = checkPermission(currentUser, 'role.READ')
    if (!permissionCheck.allowed) {
      console.log(`❌ User ${currentUser.email} denied access to view permissions:`, permissionCheck.reason)
      return { 
        permissions: null, 
        error: permissionCheck.reason || "You don't have permission to view permissions" 
      }
    }
    
    const result = await getAvailablePermissions()
    
    if (!result.success) {
      console.log("❌ getAvailablePermissions failed:", result.error)
      return { permissions: null, error: result.error }
    }

    console.log(`✅ User ${currentUser.email} fetched permissions:`, {
      tableCount: Object.keys(result.data.grouped).length,
      tables: Object.keys(result.data.grouped),
      totalPermissions: result.data.total
    })

    // Return the grouped permissions for compatibility
    return { 
      permissions: result.data.grouped, 
      error: null 
    }
  } catch (error) {
    console.error("❌ getPermissions bridge error:", error)
    return { 
      permissions: null, 
      error: error instanceof Error ? error.message : "Failed to fetch permissions" 
    }
  }
}

/**
 * Create new role (bridge function)
 */
export async function createRole(data: {
  name: string
  description?: string
  permissions: string[]
  isSystem?: boolean
}) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create roles
    const permissionCheck = checkPermission(currentUser, 'role.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to create roles" 
      }
    }

    // Additional validation: Non-SUPER_ADMINs cannot create system roles
    if (data.isSystem && !checkPermission(currentUser, 'SYSTEM.ADMIN').allowed) {
      return { 
        success: false, 
        error: "Only system administrators can create system roles" 
      }
    }

    // Additional validation: Check if user can assign all the requested permissions
    for (const permission of data.permissions) {
      // System permissions require SYSTEM.ROLE_MANAGEMENT
      if (permission.startsWith('SYSTEM.') && !checkPermission(currentUser, 'SYSTEM.ROLE_MANAGEMENT').allowed) {
        return { 
          success: false, 
          error: `You don't have permission to assign system permission: ${permission}` 
        }
      }
    }

    const result = await createRoleWithPermissions(data)
    
    if (result.success) {
      console.log(`✅ User ${currentUser.email} created role: ${result.data?.name}`)
    }

    return result
  } catch (error) {
    console.error("Failed to create role:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create role" 
    }
  }
}

/**
 * Update role permissions (bridge function)
 */
export async function updateRole(roleId: string, permissions: string[]) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to update roles
    const permissionCheck = checkPermission(currentUser, 'role.UPDATE', {
      resourceId: roleId
    })
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to update this role" 
      }
    }

    // Get the role to check if it's a system role
    const roleResult = await getRoleById(roleId)
    if (!roleResult.success) {
      return { success: false, error: "Role not found" }
    }

    // Additional validation: Non-SUPER_ADMINs cannot modify system roles
    if (roleResult.data.isSystem && !checkPermission(currentUser, 'SYSTEM.ADMIN').allowed) {
      return { 
        success: false, 
        error: "Only system administrators can modify system roles" 
      }
    }

    // Additional validation: Check if user can assign all the requested permissions
    for (const permission of permissions) {
      // System permissions require SYSTEM.ROLE_MANAGEMENT
      if (permission.startsWith('SYSTEM.') && !checkPermission(currentUser, 'SYSTEM.ROLE_MANAGEMENT').allowed) {
        return { 
          success: false, 
          error: `You don't have permission to assign system permission: ${permission}` 
        }
      }
    }

    const result = await updateRolePermissions(roleId, permissions)
    
    if (result.success) {
      console.log(`✅ User ${currentUser.email} updated role permissions: ${roleResult.data.name}`)
    }

    return result
  } catch (error) {
    console.error("Failed to update role:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update role" 
    }
  }
}

/**
 * Delete role (bridge function)
 */
export async function removeRole(roleId: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to delete roles
    const permissionCheck = checkPermission(currentUser, 'role.DELETE', {
      resourceId: roleId
    })
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to delete this role" 
      }
    }

    // Get the role to check if it's a system role
    const roleResult = await getRoleById(roleId)
    if (!roleResult.success) {
      return { success: false, error: "Role not found" }
    }

    // Additional validation: Non-SUPER_ADMINs cannot delete system roles
    if (roleResult.data.isSystem && !checkPermission(currentUser, 'SYSTEM.ADMIN').allowed) {
      return { 
        success: false, 
        error: "Only system administrators can delete system roles" 
      }
    }

    // Additional validation: Cannot delete role if it has users assigned
    if (roleResult.data.users && roleResult.data.users.length > 0) {
      return { 
        success: false, 
        error: `Cannot delete role with ${roleResult.data.users.length} assigned user(s). Please reassign users first.` 
      }
    }

    const result = await deleteRole(roleId)
    
    if (result.success) {
      console.log(`✅ User ${currentUser.email} deleted role: ${roleResult.data.name}`)
    }

    return result
  } catch (error) {
    console.error("Failed to delete role:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete role" 
    }
  }
}

/**
 * Duplicate role (bridge function)
 */
export async function copyRole(roleId: string, newName: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create roles (duplicating creates a new role)
    const permissionCheck = checkPermission(currentUser, 'role.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to duplicate roles" 
      }
    }

    // Check if user has permission to read the source role
    const readPermissionCheck = checkPermission(currentUser, 'role.READ')
    if (!readPermissionCheck.allowed) {
      return { 
        success: false, 
        error: "You don't have permission to read the source role" 
      }
    }

    const result = await duplicateRole(roleId, newName)
    
    if (result.success) {
      console.log(`✅ User ${currentUser.email} duplicated role to: ${newName}`)
    }

    return result
  } catch (error) {
    console.error("Failed to duplicate role:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to duplicate role" 
    }
  }
}

/**
 * Check role management permissions
 */
export async function checkRolePermissions(roleId?: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { 
        success: false, 
        error: "Authentication required",
        permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canManageSystem: false }
      }
    }

    let permissions = {
      canRead: checkPermission(currentUser, 'role.READ').allowed,
      canCreate: checkPermission(currentUser, 'role.CREATE').allowed,
      canUpdate: false,
      canDelete: false,
      canManageSystem: checkPermission(currentUser, 'SYSTEM.ADMIN').allowed,
    }

    // If specific role ID is provided, check update/delete permissions
    if (roleId) {
      permissions.canUpdate = checkPermission(currentUser, 'role.UPDATE', {
        resourceId: roleId
      }).allowed

      permissions.canDelete = checkPermission(currentUser, 'role.DELETE', {
        resourceId: roleId
      }).allowed
    }

    return { success: true, permissions }
  } catch (error) {
    console.error("Failed to check role permissions:", error)
    return { 
      success: false, 
      error: "Failed to check permissions",
      permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canManageSystem: false }
    }
  }
}

/**
 * Get roles with permission context
 */
export async function getRolesWithPermissionContext() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { roles: null, error: "Authentication required" }
    }

    // Check if user has permission to read roles
    const permissionCheck = checkPermission(currentUser, 'role.READ')
    if (!permissionCheck.allowed) {
      return { 
        roles: null, 
        error: "You don't have permission to view roles" 
      }
    }

    const result = await getRolesWithPermissions()
    
    if (!result.success) {
      return { roles: null, error: result.error }
    }

    // Add permission context to each role
    const rolesWithPermissions = result.data.map(role => ({
      ...role,
      userCount: role.users?.length || 0,
      isSystemRole: role.isSystem || false,
      canEdit: checkPermission(currentUser, 'role.UPDATE', {
        resourceId: role.id
      }).allowed && (!role.isSystem || checkPermission(currentUser, 'SYSTEM.ADMIN').allowed),
      canDelete: checkPermission(currentUser, 'role.DELETE', {
        resourceId: role.id
      }).allowed && (!role.isSystem || checkPermission(currentUser, 'SYSTEM.ADMIN').allowed) && (!role.users || role.users.length === 0),
    }))

    return { 
      roles: rolesWithPermissions, 
      canCreate: checkPermission(currentUser, 'role.CREATE').allowed,
      canManageSystem: checkPermission(currentUser, 'SYSTEM.ADMIN').allowed,
      error: null 
    }
  } catch (error) {
    console.error("Failed to fetch roles with permission context:", error)
    return { 
      roles: null, 
      error: error instanceof Error ? error.message : "Failed to fetch roles" 
    }
  }
}

// Re-export with new names to avoid conflicts
export { 
  createRole as createRoleWithPermissions, 
  updateRole as updateRolePermissions, 
  removeRole as deleteRole, 
  copyRole as duplicateRole 
}