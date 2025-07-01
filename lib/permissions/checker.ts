// lib/permissions/checker.ts - Simplified for array-based permissions
import { 
    UserWithPermissions, 
    PermissionCheckResult, 
    PermissionContext,
    PermissionOperation,
    PermissionString,
    SYSTEM_PERMISSIONS,
    PERMISSION_HIERARCHY,
    ROUTE_TABLE_MAPPING,
    PERMISSION_ERRORS,
    parsePermissionString,
    createPermissionString,
    getAllUserPermissions
  } from './types'
  import { getTableNameFromRoute } from './schema-reader'
  
  /**
   * Route-level permission checker
   * Usage: checkPermission(user, "article.CREATE")
   * Usage: checkPermission(user, "user.READ", { userId: "123" })
   */
  export function checkPermission(
    user: UserWithPermissions | null,
    requiredPermission: PermissionString,
    context: PermissionContext = {}
  ): PermissionCheckResult {
    // Check if user exists
    if (!user) {
      return {
        allowed: false,
        reason: PERMISSION_ERRORS.UNAUTHORIZED,
        requiredPermission
      }
    }

    console.log("REQUIRED PERMISSION", requiredPermission);
  
    // System admin bypasses all checks
    // if (hasSystemPermission(user, 'SUPER_ADMIN')) {
    //   return { allowed: true }
    // }
  
    // Parse the required permission
    const parsed = parsePermissionString(requiredPermission)
    if (!parsed) {
      return {
        allowed: false,
        reason: 'Invalid permission format',
        requiredPermission
      }
    }
  
    const { table, operation } = parsed
  
    // Check if user has the exact permission
    if (hasExactPermission(user, requiredPermission)) {
      return checkAdditionalConditions(user, table, operation, context)
    }
  
    // Check if user has higher-level permission (e.g., ALL includes CREATE)
    if (hasHigherPermission(user, table, operation)) {
      return checkAdditionalConditions(user, table, operation, context)
    }
    
    return {
      allowed: false,
      reason: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS,
      requiredPermission
    }
  }
  
  /**
   * Database operation permission checker
   * Usage: checkOperationPermission(user, "article", "CREATE")
   * Usage: checkOperationPermission(user, "user", "UPDATE", { resourceId: "123" })
   */
  export function checkOperationPermission(
    user: UserWithPermissions | null,
    tableName: string,
    operation: PermissionOperation,
    context: PermissionContext = {}
  ): PermissionCheckResult {
    const permissionString = createPermissionString(tableName, operation)
    return checkPermission(user, permissionString, context)
  }
  
  /**
   * Route-based permission checker
   * Usage: checkRoutePermission(user, "/admin/articles", "CREATE")
   */
  export function checkRoutePermission(
    user: UserWithPermissions | null,
    routePath: string,
    operation: PermissionOperation,
    context: PermissionContext = {}
  ): PermissionCheckResult {
    // Get table name from route
    const tableName = getTableNameFromRoute(routePath) || ROUTE_TABLE_MAPPING[routePath]
    
    if (!tableName) {
      return {
        allowed: false,
        reason: 'Unknown route or table mapping not found',
        requiredPermission: `${routePath}.${operation}`
      }
    }
  
    return checkOperationPermission(user, tableName, operation, context)
  }
  
  /**
   * Bulk permission checker
   * Usage: checkMultiplePermissions(user, ["article.READ", "article.CREATE"])
   */
  export function checkMultiplePermissions(
    user: UserWithPermissions | null,
    requiredPermissions: PermissionString[],
    requireAll: boolean = true
  ): PermissionCheckResult {
    if (!user) {
      return {
        allowed: false,
        reason: PERMISSION_ERRORS.UNAUTHORIZED
      }
    }
  
    const results = requiredPermissions.map(permission => 
      checkPermission(user, permission)
    )
  
    if (requireAll) {
      // All permissions must be granted
      const failed = results.find(result => !result.allowed)
      if (failed) {
        return {
          allowed: false,
          reason: failed.reason,
          requiredPermission: failed.requiredPermission
        }
      }
      return { allowed: true }
    } else {
      // At least one permission must be granted
      const hasAny = results.some(result => result.allowed)
      if (!hasAny) {
        return {
          allowed: false,
          reason: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS,
          requiredPermission: requiredPermissions.join(' OR ')
        }
      }
      return { allowed: true }
    }
  }
  
  // Helper functions (simplified)
  
  function hasSystemPermission(user: UserWithPermissions, permission: string): boolean {
    const systemPermission = `SYSTEM.${permission}`
    return hasExactPermission(user, systemPermission as PermissionString)
  }
  
  function hasExactPermission(user: UserWithPermissions, permission: PermissionString): boolean {
    const allPermissions = getAllUserPermissions(user)
    return allPermissions.includes(permission)
  }
  
  function hasHigherPermission(user: UserWithPermissions, table: string, operation: PermissionOperation): boolean {
    const allPermissions = getAllUserPermissions(user)
    
    // Check if user has 'ALL' permission for the table
    const allPermission = createPermissionString(table, 'ALL')
    if (allPermissions.includes(allPermission)) {
      return true
    }
  
    // Check permission hierarchy - if user has a higher permission that includes this operation
    for (const userPermission of allPermissions) {
      const parsed = parsePermissionString(userPermission as PermissionString)
      if (parsed && parsed.table === table) {
        const hierarchy = PERMISSION_HIERARCHY[parsed.operation] || []
        if (hierarchy.includes(operation)) {
          return true
        }
      }
    }
  
    return false
  }
  
  function checkAdditionalConditions(
    user: UserWithPermissions,
    table: string,
    operation: PermissionOperation,
    context: PermissionContext
  ): PermissionCheckResult {
    // Add custom business logic here
    
    // Example: Only allow users to modify their own profile
    if (table === 'user' && operation !== 'READ' && context.resourceId) {
      if (context.resourceId !== user.id && !hasSystemPermission(user, 'USER_MANAGEMENT')) {
        return {
          allowed: false,
          reason: PERMISSION_ERRORS.OWNER_ONLY,
          requiredPermission: createPermissionString(table, operation)
        }
      }
    }
  
    // Example: Authors can only edit their own articles
    if (table === 'article' && (operation === 'UPDATE' || operation === 'DELETE')) {
      if (context.resourceOwner && context.resourceOwner !== user.id && !hasSystemPermission(user, 'ADMIN')) {
        return {
          allowed: false,
          reason: PERMISSION_ERRORS.RESOURCE_ACCESS_DENIED,
          requiredPermission: createPermissionString(table, operation)
        }
      }
    }
  
    return { allowed: true }
  }
  
  /**
   * Get all permissions for a user (flattened)
   */
  export function getUserPermissions(user: UserWithPermissions): string[] {
    return getAllUserPermissions(user)
  }
  
  /**
   * Check if user has any admin privileges
   */
  export function isAdmin(user: UserWithPermissions | null): boolean {
    if (!user) return false
    
    return hasSystemPermission(user, 'ADMIN') || 
           hasSystemPermission(user, 'USER_MANAGEMENT') ||
           hasSystemPermission(user, 'ROLE_MANAGEMENT')
  }
  
  /**
   * Check if user has specific system permission
   */
  export function hasSystemAccess(user: UserWithPermissions | null, systemPermission: keyof typeof SYSTEM_PERMISSIONS): boolean {
    if (!user) return false
    
    return hasSystemPermission(user, systemPermission)
  }
  
  /**
   * Permission middleware helper for route protection
   */
  export function createPermissionMiddleware(
    requiredPermission: PermissionString,
    context?: PermissionContext
  ) {
    return (user: UserWithPermissions | null) => {
      return checkPermission(user, requiredPermission, context)
    }
  }
  
  /**
   * Generate permission summary for debugging
   */
  export function getPermissionSummary(user: UserWithPermissions): {
    userId: string
    roleName: string
    allPermissions: string[]
    rolePermissions: string[]
    directPermissions: string[]
    systemPermissions: string[]
    tablePermissions: Record<string, string[]>
  } {
    const allPermissions = getAllUserPermissions(user)
    const rolePermissions = user.role.permissions || []
    const directPermissions = user.permissions || []
    
    const systemPermissions = allPermissions.filter(p => p.startsWith('SYSTEM.'))
    const tablePermissions: Record<string, string[]> = {}
    
    allPermissions
      .filter(p => !p.startsWith('SYSTEM.'))
      .forEach(permission => {
        const parsed = parsePermissionString(permission as PermissionString)
        if (parsed) {
          if (!tablePermissions[parsed.table]) {
            tablePermissions[parsed.table] = []
          }
          tablePermissions[parsed.table].push(parsed.operation)
        }
      })
  
    return {
      userId: user.id,
      roleName: user.role.name,
      allPermissions,
      rolePermissions,
      directPermissions,
      systemPermissions,
      tablePermissions
    }
  }
  
  /**
   * Check if user can access a specific table
   */
  export function canAccessTable(user: UserWithPermissions | null, tableName: string): boolean {
    if (!user) return false
    
    const allPermissions = getAllUserPermissions(user)
    
    // Check if user has any permission for this table
    return allPermissions.some(permission => {
      if (permission.startsWith('SYSTEM.ADMIN')) return true
      return permission.startsWith(`${tableName}.`)
    })
  }
  
  /**
   * Get available operations for a user on a specific table
   */
  export function getTableOperations(user: UserWithPermissions | null, tableName: string): PermissionOperation[] {
    if (!user) return []
    
    if (hasSystemPermission(user, 'ADMIN')) {
      return ['CREATE', 'READ', 'UPDATE', 'DELETE']
    }
    
    const allPermissions = getAllUserPermissions(user)
    const operations: Set<PermissionOperation> = new Set()
    
    allPermissions
      .filter(permission => permission.startsWith(`${tableName}.`))
      .forEach(permission => {
        const parsed = parsePermissionString(permission as PermissionString)
        if (parsed) {
          if (parsed.operation === 'ALL') {
            operations.add('CREATE')
            operations.add('READ')
            operations.add('UPDATE')
            operations.add('DELETE')
          } else {
            operations.add(parsed.operation)
            // Add included operations from hierarchy
            const hierarchy = PERMISSION_HIERARCHY[parsed.operation] || []
            hierarchy.forEach(op => operations.add(op))
          }
        }
      })
    
    return Array.from(operations)
  }