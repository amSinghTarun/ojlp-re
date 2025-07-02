// lib/permissions/types.ts - Updated for simplified schema
import { User, Role } from '@prisma/client'

// User with complete permission data (simplified)
export interface UserWithPermissions extends User {
  role: Role
  permissions: string[] // Direct user permissions from User model
}

// Permission operation types
export type PermissionOperation = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ALL'

// Permission format: TABLE_NAME.OPERATION
export type PermissionString = `${string}.${PermissionOperation}` | `SYSTEM.${string}`

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredPermission?: string
}

// Enhanced permission context
export interface PermissionContext {
  userId?: string
  resourceId?: string
  resourceOwner?: string
  additionalData?: Record<string, any>
}

// Permission option for UI selection
export interface PermissionOption {
  value: string
  label: string
  description: string
  category: string
}

// System-level permissions
export const SYSTEM_PERMISSIONS = {
  ADMIN: 'SYSTEM.ADMIN',
  USER_MANAGEMENT: 'SYSTEM.USER_MANAGEMENT', 
  ROLE_MANAGEMENT: 'SYSTEM.ROLE_MANAGEMENT',
  SYSTEM_SETTINGS: 'SYSTEM.SETTINGS',
  ANALYTICS_VIEW: 'SYSTEM.ANALYTICS',
  BACKUP_RESTORE: 'SYSTEM.BACKUP'
} as const

// CRUD operations constant
export const CRUD_OPERATIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ALL: 'ALL'
} as const

// Permission hierarchy (higher permissions include lower ones)
export const PERMISSION_HIERARCHY: Record<PermissionOperation, PermissionOperation[]> = {
  ALL: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
  CREATE: ['CREATE'],
  READ: ['READ'],
  UPDATE: ['READ', 'UPDATE'],
  DELETE: ['READ', 'DELETE']
}

// Route to table mapping for your actual models
export const ROUTE_TABLE_MAPPING: Record<string, string> = {
  '/admin/users': 'user',
  '/admin/roles': 'role',
  '/admin/articles': 'article',
  '/admin/journal-articles': 'article',
  '/admin/authors': 'author',
  '/admin/journal-issues': 'journalissue',
  '/admin/call-for-papers': 'callforpapers',
  '/admin/notifications': 'notification',
  '/admin/media': 'media',
  '/admin/editorial-board': 'editorialboardmember'
}

// Default role permissions (simplified) - based on your actual schema
export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    SYSTEM_PERMISSIONS.ADMIN // SUPER_ADMIN gets system admin (bypasses all checks)
  ],
  
  ADMIN: [
    SYSTEM_PERMISSIONS.USER_MANAGEMENT,
    SYSTEM_PERMISSIONS.ROLE_MANAGEMENT,
    'article.ALL',
    'author.ALL',
    'journalissue.ALL',
    'callforpapers.ALL',
    'notification.ALL',
    'media.ALL',
    'editorialboardmember.ALL'
  ],
  
  EDITOR: [
    'article.ALL',
    'author.READ',
    'author.CREATE',
    'journalissue.READ',
    'notification.CREATE',
    'notification.READ',
    'notification.UPDATE',
    'media.ALL',
    'editorialboardmember.READ'
  ],
  
  AUTHOR: [
    'article.CREATE',
    'article.READ',
    'article.UPDATE', // Only own articles
    'author.READ',
    'journalissue.READ',
    'media.READ'
  ],
  
  VIEWER: [
    'article.READ',
    'author.READ', 
    'journalissue.READ',
    'notification.READ'
  ]
} as const

// Permission error messages
export const PERMISSION_ERRORS = {
  UNAUTHORIZED: "Authentication required",
  INSUFFICIENT_PERMISSIONS: "You don't have permission to perform this action",
  RESOURCE_NOT_FOUND: "Resource not found",
  SYSTEM_ADMIN_REQUIRED: "System administrator access required",
  ROLE_MANAGEMENT_REQUIRED: "Role management permission required",
  USER_MANAGEMENT_REQUIRED: "User management permission required"
} as const

// Helper function to check if a permission is system-level
export function isSystemPermission(permission: string): boolean {
  return permission.startsWith('SYSTEM.')
}

// Helper function to extract table name from permission
export function getTableFromPermission(permission: string): string | null {
  if (isSystemPermission(permission)) return null
  
  const parts = permission.split('.')
  return parts.length >= 2 ? parts[0].toLowerCase() : null
}

// Helper function to extract operation from permission
export function getOperationFromPermission(permission: string): string | null {
  const parts = permission.split('.')
  return parts.length >= 2 ? parts[1].toUpperCase() : null
}

// Helper function to check if user has system admin access
export function hasSystemAdminAccess(user: UserWithPermissions): boolean {
  // Check direct user permissions first
  if (user.permissions?.includes(SYSTEM_PERMISSIONS.ADMIN)) {
    return true
  }
  
  // Check role permissions
  if (user.role?.permissions?.includes(SYSTEM_PERMISSIONS.ADMIN)) {
    return true
  }
  
  // Legacy check for SUPER_ADMIN role name
  if (user.role?.name === 'SUPER_ADMIN') {
    return true
  }
  
  return false
}

// Helper function to get all permissions for a user (role + direct)
export function getUserPermissions(user: UserWithPermissions): string[] {
  const rolePermissions = user.role?.permissions || []
  const directPermissions = user.permissions || []
  
  // Combine and deduplicate permissions
  return Array.from(new Set([...rolePermissions, ...directPermissions]))
}

// Helper function to check if permission exists in list
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // System admin bypass
  if (userPermissions.includes(SYSTEM_PERMISSIONS.ADMIN)) {
    return true
  }
  
  // Direct permission match
  if (userPermissions.includes(requiredPermission)) {
    return true
  }
  
  // Check for ALL permission on the same table
  const table = getTableFromPermission(requiredPermission)
  if (table && userPermissions.includes(`${table}.ALL`)) {
    return true
  }
  
  return false
}

// Type guard to check if user has permissions loaded
export function isUserWithPermissions(user: any): user is UserWithPermissions {
  return user && 
         typeof user === 'object' && 
         'role' in user && 
         user.role &&
         'permissions' in user &&
         Array.isArray(user.permissions)
}