// lib/permissions/page-protection.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { checkPermission, checkRoutePermission } from './checker'
import { UserWithPermissions, PermissionOperation } from './types'

/**
 * Server-side page protection HOC
 */
export function withPermission<T extends Record<string, any>>(
  requiredPermission: string,
  options: {
    redirectTo?: string
    fallbackComponent?: React.ComponentType<{ error: string }>
  } = {}
) {
  return function PermissionWrapper(
    WrappedComponent: React.ComponentType<T>
  ) {
    return async function ProtectedComponent(props: T) {
      const user = await getCurrentUser()
      
      if (!user) {
        redirect(options.redirectTo || '/login')
      }

      const permissionCheck = checkPermission(user, requiredPermission as any)
      
      if (!permissionCheck.allowed) {
        if (options.fallbackComponent) {
          const FallbackComponent = options.fallbackComponent
          return <FallbackComponent error={permissionCheck.reason || 'Access denied'} />
        }
        redirect(options.redirectTo || '/unauthorized')
      }

      return <WrappedComponent {...props} />
    }
  }
}

/**
 * Route-based page protection
 */
export function withRoutePermission<T extends Record<string, any>>(
  operation: PermissionOperation,
  options: {
    redirectTo?: string
    fallbackComponent?: React.ComponentType<{ error: string }>
  } = {}
) {
  return function RoutePermissionWrapper(
    WrappedComponent: React.ComponentType<T>
  ) {
    return async function ProtectedComponent(props: T & { 
      params?: Record<string, string>
      searchParams?: Record<string, string>
    }) {
      const user = await getCurrentUser()
      
      if (!user) {
        redirect(options.redirectTo || '/login')
      }

      // Get current route from props or construct it
      const routePath = getRouteFromProps(props)
      
      const permissionCheck = checkRoutePermission(user, routePath, operation)
      
      if (!permissionCheck.allowed) {
        if (options.fallbackComponent) {
          const FallbackComponent = options.fallbackComponent
          return <FallbackComponent error={permissionCheck.reason || 'Access denied'} />
        }
        redirect(options.redirectTo || '/unauthorized')
      }

      return <WrappedComponent {...props} />
    }
  }
}