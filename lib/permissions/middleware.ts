// lib/permissions/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { checkRoutePermission, checkPermission } from './checker'
import { UserWithPermissions, PermissionOperation } from './types'
import { prisma } from '@/lib/prisma'

/**
 * Get current user with permissions for middleware
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
 * Middleware for protecting API routes with permissions
 */
export async function createPermissionMiddleware(
  requiredPermission: string,
  options: {
    allowOwner?: boolean
    ownerField?: string
    getResourceOwner?: (request: NextRequest) => Promise<string | null>
  } = {}
) {
  return async function permissionMiddleware(
    request: NextRequest,
    context: { params?: Record<string, string> } = {}
  ) {
    try {
      // Get current user with permissions
      const user = await getCurrentUserWithPermissions()
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Extract resource ID from params if available
      const resourceId = context.params?.id || context.params?.slug

      // Check basic permission
      const permissionCheck = checkPermission(user, requiredPermission as any, {
        resourceId
      })

      if (permissionCheck.allowed) {
        return NextResponse.next()
      }

      // If owner access is allowed, check ownership
      if (options.allowOwner && resourceId && options.getResourceOwner) {
        const resourceOwner = await options.getResourceOwner(request)
        if (resourceOwner === user.id) {
          return NextResponse.next()
        }
      }

      return NextResponse.json(
        { 
          error: permissionCheck.reason || 'Insufficient permissions',
          requiredPermission 
        },
        { status: 403 }
      )
    } catch (error) {
      console.error('Permission middleware error:', error)
      return NextResponse.json(
        { error: 'Permission check failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Route-based permission middleware
 */
export async function createRoutePermissionMiddleware(
  operation: PermissionOperation,
  options: {
    allowOwner?: boolean
    ownerField?: string
  } = {}
) {
  return async function routeMiddleware(
    request: NextRequest,
    context: { params?: Record<string, string> } = {}
  ) {
    try {
      const user = await getCurrentUserWithPermissions()
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Get route path from request
      const routePath = request.nextUrl.pathname
      const resourceId = context.params?.id || context.params?.slug

      // Check route permission
      const permissionCheck = checkRoutePermission(user, routePath, operation, {
        resourceId
      })

      if (permissionCheck.allowed) {
        return NextResponse.next()
      }

      // If owner access is allowed, check ownership
      if (options.allowOwner && resourceId && options.ownerField) {
        try {
          // This would need to be customized based on your data structure
          const resource = await getResourceOwner(routePath, resourceId, options.ownerField)
          if (resource && resource.ownerId === user.id) {
            return NextResponse.next()
          }
        } catch (error) {
          console.error('Error checking resource ownership:', error)
        }
      }

      return NextResponse.json(
        { 
          error: permissionCheck.reason || 'Insufficient permissions',
          operation,
          routePath
        },
        { status: 403 }
      )
    } catch (error) {
      console.error('Route permission middleware error:', error)
      return NextResponse.json(
        { error: 'Permission check failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper function to get resource owner
 * This should be customized based on your data structure
 */
async function getResourceOwner(
  routePath: string, 
  resourceId: string, 
  ownerField: string
): Promise<{ ownerId: string } | null> {
  try {
    // Extract table name from route path
    const pathParts = routePath.split('/')
    const tableName = pathParts[pathParts.length - 2] // Assuming /admin/[table]/[id] structure

    // This is a simplified example - you'd need to implement based on your schema
    switch (tableName) {
      case 'articles':
        const article = await prisma.article.findUnique({
          where: { id: resourceId },
          select: { [ownerField]: true }
        })
        return article ? { ownerId: (article as any)[ownerField] } : null

      case 'users':
        const user = await prisma.user.findUnique({
          where: { id: resourceId },
          select: { id: true }
        })
        return user ? { ownerId: user.id } : null

      default:
        return null
    }
  } catch (error) {
    console.error('Error getting resource owner:', error)
    return null
  }
}

/**
 * Simple permission check middleware for basic routes
 */
export function requireAuth() {
  return async function authMiddleware(
    request: NextRequest,
    context: { params?: Record<string, string> } = {}
  ) {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }
}