// lib/permissions/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { checkRoutePermission, checkPermission } from './checker'
import { UserWithPermissions, PermissionOperation } from './types'
import { prisma } from '@/lib/prisma'

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

      const routePath = request.nextUrl.pathname
      const resourceId = context.params?.id || context.params?.slug

      const permissionCheck = checkRoutePermission(user, routePath, operation, {
        resourceId
      })

      if (permissionCheck.allowed) {
        return NextResponse.next()
      }

      return NextResponse.json(
        { 
          error: permissionCheck.reason || 'Insufficient permissions',
          requiredPermission: permissionCheck.requiredPermission 
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

// Helper to get user with permissions
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  const user = await getCurrentUser()
  if (!user) return null

  return await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      role: {
        include: {
          permissions: true
        }
      },
      permissions: true
    }
  }) as UserWithPermissions
}