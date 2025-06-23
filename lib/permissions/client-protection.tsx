// lib/permissions/client-protection.tsx
'use client'

import { useUser } from '@/hooks/use-user' // Assuming you have a user hook
import { checkPermission } from './checker'
import { UserWithPermissions } from './types'

interface PermissionGateProps {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Client-side permission gate component
 */
export function PermissionGate({ permission, fallback, children }: PermissionGateProps) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return fallback || <div>Authentication required</div>
  }

  const permissionCheck = checkPermission(user as UserWithPermissions, permission as any)

  if (!permissionCheck.allowed) {
    return fallback || <div>Access denied</div>
  }

  return <>{children}</>
}

/**
 * Hook for checking permissions in components
 */
export function usePermission(permission: string) {
  const { user } = useUser()

  if (!user) {
    return { allowed: false, loading: false, reason: 'Not authenticated' }
  }

  const permissionCheck = checkPermission(user as UserWithPermissions, permission as any)
  
  return {
    allowed: permissionCheck.allowed,
    loading: false,
    reason: permissionCheck.reason
  }
}

/**
 * Hook for checking multiple permissions
 */
export function usePermissions(permissions: string[], requireAll = true) {
  const { user } = useUser()

  if (!user) {
    return { allowed: false, loading: false, reason: 'Not authenticated' }
  }

  const results = permissions.map(permission => 
    checkPermission(user as UserWithPermissions, permission as any)
  )

  if (requireAll) {
    const failed = results.find(result => !result.allowed)
    return {
      allowed: !failed,
      loading: false,
      reason: failed?.reason
    }
  } else {
    const hasAny = results.some(result => result.allowed)
    return {
      allowed: hasAny,
      loading: false,
      reason: hasAny ? undefined : 'Insufficient permissions'
    }
  }
}

// Helper functions
function getRouteFromProps(props: any): string {
  // Extract route from Next.js props
  // This would need to be implemented based on your routing structure
  return '/admin' // placeholder
}
