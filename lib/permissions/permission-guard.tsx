// lib/permissions/permission-guard.tsx
'use client'

import { ReactNode } from 'react'
import { useUser } from '@/hooks/use-user'
import { getUserPermissions, isSuperAdmin } from '@/lib/permissions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield } from 'lucide-react'

// CRUD operation types (client-side version)
export const CRUD_OPERATIONS = {
  VIEW: 'view',
  CREATE: 'create', 
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage'
} as const

export type CrudOperation = typeof CRUD_OPERATIONS[keyof typeof CRUD_OPERATIONS]

// Client-side permission checker
function checkCrudPermission(
  user: any,
  resource: string,
  operation: CrudOperation
): boolean {
  if (!user) return false
  
  // Super Admin has all permissions
  if (isSuperAdmin(user)) return true

  const userPermissions = getUserPermissions(user)
  
  // Check specific permission (e.g., "create_posts")
  const specificPermission = `${operation}_${resource}`
  if (userPermissions.includes(specificPermission)) return true

  // Check manage permission (e.g., "manage_posts" grants all operations)
  const managePermission = `manage_${resource}`
  if (userPermissions.includes(managePermission)) return true

  return false
}

interface CrudPermissionGuardProps {
  resource: string
  operation: keyof typeof CRUD_OPERATIONS
  children: ReactNode
  fallback?: ReactNode
  hideOnNoAccess?: boolean
}

export function CrudPermissionGuard({
  resource,
  operation,
  children,
  fallback,
  hideOnNoAccess = false
}: CrudPermissionGuardProps) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <div className="animate-pulse h-4 bg-muted rounded"></div>
  }

  if (!user) {
    return hideOnNoAccess ? null : (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>Authentication required</AlertDescription>
      </Alert>
    )
  }

  const operationValue = CRUD_OPERATIONS[operation]
  const hasPermission = checkCrudPermission(user, resource, operationValue)

  if (!hasPermission) {
    if (hideOnNoAccess) return null
    
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to {operationValue} {resource}
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}

// Alternative simpler permission guard for common use cases
interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  hideOnNoAccess?: boolean
}

export function PermissionGuard({
  permission,
  children,
  fallback,
  hideOnNoAccess = false
}: PermissionGuardProps) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <div className="animate-pulse h-4 bg-muted rounded"></div>
  }

  if (!user) {
    return hideOnNoAccess ? null : (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>Authentication required</AlertDescription>
      </Alert>
    )
  }

  // Super Admin has all permissions
  if (isSuperAdmin(user)) {
    return <>{children}</>
  }

  const userPermissions = getUserPermissions(user)
  const hasPermission = userPermissions.includes(permission)

  if (!hasPermission) {
    if (hideOnNoAccess) return null
    
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have the required permission: {permission}
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}

// Hook for checking permissions in components
export function usePermission(permission: string): boolean {
  const { user } = useUser()
  
  if (!user) return false
  if (isSuperAdmin(user)) return true

  const userPermissions = getUserPermissions(user)
  return userPermissions.includes(permission)
}

// Hook for checking CRUD permissions
export function useCrudPermission(
  resource: string, 
  operation: CrudOperation
): boolean {
  const { user } = useUser()
  return checkCrudPermission(user, resource, operation)
}

// Hook for multiple permissions (user needs ANY of them)
export function useAnyPermission(permissions: string[]): boolean {
  const { user } = useUser()
  
  if (!user) return false
  if (isSuperAdmin(user)) return true

  const userPermissions = getUserPermissions(user)
  return permissions.some(permission => userPermissions.includes(permission))
}

// Hook for multiple permissions (user needs ALL of them)
export function useAllPermissions(permissions: string[]): boolean {
  const { user } = useUser()
  
  if (!user) return false
  if (isSuperAdmin(user)) return true

  const userPermissions = getUserPermissions(user)
  return permissions.every(permission => userPermissions.includes(permission))
}

// Component for conditional rendering based on user role
interface RoleGuardProps {
  roles: string[]
  children: ReactNode
  fallback?: ReactNode
  hideOnNoAccess?: boolean
}

export function RoleGuard({
  roles,
  children,
  fallback,
  hideOnNoAccess = false
}: RoleGuardProps) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <div className="animate-pulse h-4 bg-muted rounded"></div>
  }

  if (!user) {
    return hideOnNoAccess ? null : (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>Authentication required</AlertDescription>
      </Alert>
    )
  }

  const hasRole = roles.includes(user.role?.name)

  if (!hasRole) {
    if (hideOnNoAccess) return null
    
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access restricted to: {roles.join(', ')}
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}