// lib/permissions/types.ts - Simplified for array-based permissions
import { User, Role } from '@prisma/client'

// User with complete permission data (simplified)
export interface UserWithPermissions extends User {
  role: Role
  permissions: string[] // Direct user permissions
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

// Route to table mapping
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
  '/admin/categories': 'category'
}

// Default role permissions (simplified)
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
    'category.ALL'
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
    'category.READ'
  ],
  
  AUTHOR: [
    'article.CREATE',
    'article.READ',
    'author.READ',
    'media.CREATE',
    'media.READ'
  ],
  
  REVIEWER: [
    'article.READ',
    'author.READ',
    'journalissue.READ'
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
  UNAUTHORIZED: 'You are not authorized to perform this action',
  INSUFFICIENT_PERMISSIONS: 'You do not have sufficient permissions for this operation',
  RESOURCE_NOT_FOUND: 'The requested resource was not found',
  RESOURCE_ACCESS_DENIED: 'You do not have access to this resource',
  OPERATION_NOT_ALLOWED: 'This operation is not allowed for your role',
  SYSTEM_ADMIN_REQUIRED: 'System administrator privileges required',
  OWNER_ONLY: 'This action can only be performed by the resource owner'
} as const

// Permission validation helpers
export function isValidPermissionString(permission: string): permission is PermissionString {
  if (permission.startsWith('SYSTEM.')) return true
  
  const parts = permission.split('.')
  if (parts.length !== 2) return false
  
  const [table, operation] = parts
  return table.length > 0 && Object.values(CRUD_OPERATIONS).includes(operation as any)
}

export function parsePermissionString(permission: PermissionString): { table: string; operation: PermissionOperation } | null {
  if (permission.startsWith('SYSTEM.')) {
    return { table: 'SYSTEM', operation: permission.split('.')[1] as PermissionOperation }
  }
  
  const parts = permission.split('.')
  if (parts.length !== 2) return null
  
  return {
    table: parts[0],
    operation: parts[1] as PermissionOperation
  }
}

export function createPermissionString(table: string, operation: PermissionOperation): PermissionString {
  return `${table}.${operation}` as PermissionString
}

// Helper to get all user permissions (role + direct permissions)
export function getAllUserPermissions(user: UserWithPermissions): string[] {
  const rolePermissions = user.role.permissions || []
  const userPermissions = user.permissions || []
  
  return Array.from(new Set([...rolePermissions, ...userPermissions]))
}