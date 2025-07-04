// lib/permissions/decorators.ts

import { getCurrentUser } from "../auth"
import { checkPermission } from "./checker"
import { UserWithPermissions } from "./types"

/**
 * Method decorator for server actions
 */
export function requirePermission(permission: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const user = await getCurrentUser()
      
      if (!user) {
        throw new Error('Authentication required')
      }

      // Cast user to UserWithPermissions for permission checking
      const userWithPermissions = user as UserWithPermissions
      const permissionCheck = checkPermission(userWithPermissions, permission as any)
      
      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.reason || 'Insufficient permissions')
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * Class decorator for protecting entire service classes
 */
export function requireSystemAccess(systemPermission: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args)
        
        // Add permission check to all methods
        Object.getOwnPropertyNames(constructor.prototype).forEach(methodName => {
          if (methodName !== 'constructor' && typeof (this as any)[methodName] === 'function') {
            const originalMethod = (this as any)[methodName]
            
            ;(this as any)[methodName] = async function (...methodArgs: any[]) {
              const user = await getCurrentUser()
              
              if (!user) {
                throw new Error('Authentication required')
              }

              // Cast user to UserWithPermissions for permission checking
              const userWithPermissions = user as UserWithPermissions
              const permissionCheck = checkPermission(userWithPermissions, systemPermission as any)
              
              if (!permissionCheck.allowed) {
                throw new Error(permissionCheck.reason || 'Insufficient permissions')
              }

              return originalMethod.apply(this, methodArgs)
            }
          }
        })
      }
    }
  }
}