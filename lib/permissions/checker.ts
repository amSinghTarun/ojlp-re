// lib/permissions/checker.ts - Updated for simplified schema
import { 
  UserWithPermissions, 
  PermissionContext, 
  PermissionCheckResult,
  SYSTEM_PERMISSIONS,
  PERMISSION_ERRORS,
  getUserPermissions,
  hasPermission,
  hasSystemAdminAccess,
  isSystemPermission
} from './types'

/**
 * Main permission checking function - Updated for simplified schema
 */
export function checkPermission(
  user: UserWithPermissions,
  requiredPermission: string,
  context?: PermissionContext
): PermissionCheckResult {
  try {
    // Basic validation
    if (!user) {
      return {
        allowed: false,
        reason: PERMISSION_ERRORS.UNAUTHORIZED,
        requiredPermission
      }
    }

    // System admin bypass - check user's combined permissions
    if (hasSystemAdminAccess(user)) {
      return { allowed: true }
    }

    // Get all user permissions (role + direct)
    const userPermissions = getUserPermissions(user)

    // Self-access rules (users can usually read/update their own data)
    if (context?.userId && context.resourceId && context.userId === context.resourceId) {
      if (requiredPermission.endsWith('.READ') || requiredPermission.endsWith('.UPDATE')) {
        return { allowed: true }
      }
    }

    // Check if user has the required permission
    if (hasPermission(userPermissions, requiredPermission)) {
      return { allowed: true }
    }

    // Special handling for system permissions
    if (isSystemPermission(requiredPermission)) {
      return {
        allowed: false,
        reason: PERMISSION_ERRORS.SYSTEM_ADMIN_REQUIRED,
        requiredPermission
      }
    }

    // Default denial
    return {
      allowed: false,
      reason: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS,
      requiredPermission
    }

  } catch (error) {
    console.error('Permission check error:', error)
    return {
      allowed: false,
      reason: 'Permission check failed',
      requiredPermission
    }
  }
}

/**
 * Check multiple permissions (user must have ALL)
 */
export function checkPermissions(
  user: UserWithPermissions,
  requiredPermissions: string[],
  context?: PermissionContext
): PermissionCheckResult {
  if (!requiredPermissions.length) {
    return { allowed: true }
  }

  for (const permission of requiredPermissions) {
    const result = checkPermission(user, permission, context)
    if (!result.allowed) {
      return result
    }
  }

  return { allowed: true }
}

/**
 * Check if user has ANY of the specified permissions
 */
export function checkAnyPermission(
  user: UserWithPermissions,
  permissions: string[],
  context?: PermissionContext
): PermissionCheckResult {
  if (!permissions.length) {
    return { allowed: false, reason: 'No permissions specified' }
  }

  // System admin bypass
  if (hasSystemAdminAccess(user)) {
    return { allowed: true }
  }

  for (const permission of permissions) {
    const result = checkPermission(user, permission, context)
    if (result.allowed) {
      return { allowed: true }
    }
  }

  return {
    allowed: false,
    reason: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS,
    requiredPermission: permissions.join(' OR ')
  }
}

/**
 * Check if user can manage another user (special business logic)
 */
export function canManageUser(
  currentUser: UserWithPermissions,
  targetUser: UserWithPermissions
): PermissionCheckResult {
  // Users cannot manage themselves through admin interface
  if (currentUser.id === targetUser.id) {
    return {
      allowed: false,
      reason: "Cannot manage your own account through this interface"
    }
  }

  // System admin can manage anyone
  if (hasSystemAdminAccess(currentUser)) {
    return { allowed: true }
  }

  // Check if user has user management permission
  const userManagementCheck = checkPermission(currentUser, SYSTEM_PERMISSIONS.USER_MANAGEMENT)
  if (userManagementCheck.allowed) {
    // Non-system admins cannot manage SUPER_ADMINs
    if (hasSystemAdminAccess(targetUser)) {
      return {
        allowed: false,
        reason: "Only system administrators can manage system users"
      }
    }
    return { allowed: true }
  }

  // Check basic user permissions
  const userUpdateCheck = checkPermission(currentUser, 'user.UPDATE')
  if (userUpdateCheck.allowed) {
    // Same restriction for basic user management
    if (hasSystemAdminAccess(targetUser)) {
      return {
        allowed: false,
        reason: "Only system administrators can manage system users"
      }
    }
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS
  }
}

/**
 * Check if user can assign a specific role
 */
export function canAssignRole(
  user: UserWithPermissions,
  roleToAssign: { name: string; isSystem?: boolean; permissions?: string[] }
): PermissionCheckResult {
  // System admin can assign any role
  if (hasSystemAdminAccess(user)) {
    return { allowed: true }
  }

  // Check if user has role management permission
  const roleManagementCheck = checkPermission(user, SYSTEM_PERMISSIONS.ROLE_MANAGEMENT)
  if (!roleManagementCheck.allowed) {
    return roleManagementCheck
  }

  // Non-system admins cannot assign system roles
  if (roleToAssign.isSystem || roleToAssign.name === 'SUPER_ADMIN') {
    return {
      allowed: false,
      reason: "Only system administrators can assign system roles"
    }
  }

  // Check if role contains system permissions
  if (roleToAssign.permissions) {
    const hasSystemPerms = roleToAssign.permissions.some(perm => isSystemPermission(perm))
    if (hasSystemPerms) {
      return {
        allowed: false,
        reason: "Only system administrators can assign roles with system permissions"
      }
    }
  }

  return { allowed: true }
}

/**
 * Check if user can manage permissions
 */
export function canManagePermissions(
  user: UserWithPermissions,
  targetUser?: UserWithPermissions,
  permissionsToAssign?: string[]
): PermissionCheckResult {
  // System admin can manage any permissions
  if (hasSystemAdminAccess(user)) {
    return { allowed: true }
  }

  // Check if user has user management permission
  const userManagementCheck = checkPermission(user, SYSTEM_PERMISSIONS.USER_MANAGEMENT)
  if (!userManagementCheck.allowed) {
    return userManagementCheck
  }

  // If target user is specified, check if they can manage that user
  if (targetUser) {
    const canManageCheck = canManageUser(user, targetUser)
    if (!canManageCheck.allowed) {
      return canManageCheck
    }
  }

  // If specific permissions are being assigned, validate them
  if (permissionsToAssign) {
    const systemPermissions = permissionsToAssign.filter(perm => isSystemPermission(perm))
    if (systemPermissions.length > 0) {
      return {
        allowed: false,
        reason: "Only system administrators can assign system-level permissions"
      }
    }
  }

  return { allowed: true }
}

/**
 * Helper function to check resource ownership
 */
export function checkResourceOwnership(
  user: UserWithPermissions,
  resourceOwnerId?: string
): boolean {
  if (!resourceOwnerId) return false
  return user.id === resourceOwnerId
}

/**
 * Filter items based on user permissions (for lists)
 */
export function filterByPermissions<T extends { id?: string; createdBy?: string }>(
  user: UserWithPermissions,
  items: T[],
  requiredPermission: string
): T[] {
  // System admin sees everything
  if (hasSystemAdminAccess(user)) {
    return items
  }

  // Check if user has general permission
  const hasGeneralPermission = checkPermission(user, requiredPermission).allowed

  if (hasGeneralPermission) {
    return items
  }

  // If no general permission, only show items they own
  return items.filter(item => 
    item.createdBy === user.id || item.id === user.id
  )
}

/**
 * Get user's effective permissions (for debugging/display)
 */
export function getEffectivePermissions(user: UserWithPermissions): {
  rolePermissions: string[]
  directPermissions: string[]
  allPermissions: string[]
  hasSystemAccess: boolean
} {
  const rolePermissions = user.role?.permissions || []
  const directPermissions = user.permissions || []
  const allPermissions = getUserPermissions(user)

  return {
    rolePermissions,
    directPermissions,
    allPermissions,
    hasSystemAccess: hasSystemAdminAccess(user)
  }
}