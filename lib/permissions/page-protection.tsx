// lib/permissions/page-protection.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { checkPermission, checkRoutePermission } from './checker'
import { UserWithPermissions, PermissionOperation } from './types'
import { prisma } from '@/lib/prisma'

/**
 * Get current user with permissions for page protection
 */
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    // If user already has role and permissions, return as is
    if ('role' in user && user.role && 'permissions' in user.role) {
      return user as UserWithPermissions
    }

    // Otherwise fetch the complete user data with role and permissions
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true
      }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

/**
 * Extract route path from Next.js page props
 */
function getRouteFromProps(props: any): string {
  // Handle different Next.js routing patterns
  if (props.params) {
    // Dynamic routes like [id], [slug], etc.
    const segments = []
    
    // Try to reconstruct the path from params
    Object.entries(props.params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        segments.push(...value)
      } else {
        segments.push(value as string)
      }
    })
    
    // This is a simplified approach - you might need to customize based on your routing structure
    return `/admin/${segments.join('/')}`
  }
  
  // For static routes, we'll need to determine this differently
  // This is a fallback - in practice, you might want to pass the route explicitly
  return '/admin'
}

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
      const user = await getCurrentUserWithPermissions()
      
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
    routePath?: string // Allow explicit route path
  } = {}
) {
  return function RoutePermissionWrapper(
    WrappedComponent: React.ComponentType<T>
  ) {
    return async function ProtectedComponent(props: T & { 
      params?: Record<string, string>
      searchParams?: Record<string, string>
    }) {
      const user = await getCurrentUserWithPermissions()
      
      if (!user) {
        redirect(options.redirectTo || '/login')
      }

      // Get current route from options or props
      const routePath = options.routePath || getRouteFromProps(props)
      
      const permissionCheck = checkRoutePermission(user, routePath, operation, {
        resourceId: props.params?.id || props.params?.slug
      })
      
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
 * Owner-based page protection - allows access if user owns the resource
 */
export function withOwnershipProtection<T extends Record<string, any>>(
  requiredPermission: string,
  options: {
    ownerField?: string
    tableName?: string
    redirectTo?: string
    fallbackComponent?: React.ComponentType<{ error: string }>
  } = {}
) {
  return function OwnershipWrapper(
    WrappedComponent: React.ComponentType<T>
  ) {
    return async function ProtectedComponent(props: T & { 
      params?: Record<string, string>
    }) {
      const user = await getCurrentUserWithPermissions()
      
      if (!user) {
        redirect(options.redirectTo || '/login')
      }

      // Check basic permission first
      const permissionCheck = checkPermission(user, requiredPermission as any)
      
      if (permissionCheck.allowed) {
        return <WrappedComponent {...props} />
      }

      // If basic permission fails, check ownership
      const resourceId = props.params?.id || props.params?.slug
      if (resourceId && options.tableName && options.ownerField) {
        try {
          const isOwner = await checkResourceOwnership(
            user.id,
            resourceId,
            options.tableName,
            options.ownerField
          )

          if (isOwner) {
            return <WrappedComponent {...props} />
          }
        } catch (error) {
          console.error('Error checking ownership:', error)
        }
      }

      // Access denied
      if (options.fallbackComponent) {
        const FallbackComponent = options.fallbackComponent
        return <FallbackComponent error="Access denied - insufficient permissions" />
      }
      redirect(options.redirectTo || '/unauthorized')
    }
  }
}

/**
 * Helper function to check resource ownership
 */
async function checkResourceOwnership(
  userId: string,
  resourceId: string,
  tableName: string,
  ownerField: string = 'userId'
): Promise<boolean> {
  try {
    // This is a simplified example - you'd need to implement based on your schema
    switch (tableName) {
      case 'article':
        const article = await prisma.article.findUnique({
          where: { id: resourceId },
          select: { [ownerField]: true }
        })
        return article && (article as any)[ownerField] === userId

      case 'user':
        // Users can always access their own profile
        return resourceId === userId

      default:
        // For other tables, you'd implement similar logic
        console.warn(`Ownership check not implemented for table: ${tableName}`)
        return false
    }
  } catch (error) {
    console.error('Error checking resource ownership:', error)
    return false
  }
}

/**
 * Simple authentication protection (no specific permissions required)
 */
export function withAuth<T extends Record<string, any>>(
  options: {
    redirectTo?: string
    fallbackComponent?: React.ComponentType<{ error: string }>
  } = {}
) {
  return function AuthWrapper(
    WrappedComponent: React.ComponentType<T>
  ) {
    return async function ProtectedComponent(props: T) {
      const user = await getCurrentUser()
      
      if (!user) {
        if (options.fallbackComponent) {
          const FallbackComponent = options.fallbackComponent
          return <FallbackComponent error="Authentication required" />
        }
        redirect(options.redirectTo || '/login')
      }

      return <WrappedComponent {...props} />
    }
  }
}