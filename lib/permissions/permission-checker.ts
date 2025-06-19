import { getUserPermissions, isSuperAdmin } from '@/lib/permissions'
import { CRUD_OPERATIONS, CrudOperation } from './route-discovery'

// Check if user has permission for a specific route
export async function hasPermissionForRoute(
  user: any, 
  pathname: string
): Promise<boolean> {
  // Super Admin always has access
  if (isSuperAdmin(user)) return true

  // Extract route segment and operation from pathname
  const { segment, operation } = parseRoutePermission(pathname)
  if (!segment) return true // No permission required

  const userPermissions = getUserPermissions(user)
  
  // Check for specific operation permission
  const specificPermission = `${operation}_${segment}`
  if (userPermissions.includes(specificPermission)) return true

  // Check for manage permission (grants all operations)
  const managePermission = `manage_${segment}`
  if (userPermissions.includes(managePermission)) return true

  return false
}

// Parse route to determine required permission
function parseRoutePermission(pathname: string): {
  segment: string | null
  operation: string
} {
  // Remove /admin prefix
  const routePath = pathname.replace('/admin', '')
  
  if (!routePath || routePath === '/') {
    return { segment: 'dashboard', operation: CRUD_OPERATIONS.VIEW }
  }

  const parts = routePath.split('/').filter(Boolean)
  const segment = parts[0] // First segment is the resource

  // Determine operation based on route structure
  if (parts.includes('new')) {
    return { segment, operation: CRUD_OPERATIONS.CREATE }
  }
  
  if (parts.includes('edit')) {
    return { segment, operation: CRUD_OPERATIONS.EDIT }
  }

  // Default to view for listing and detail pages
  return { segment, operation: CRUD_OPERATIONS.VIEW }
}

// CRUD permission checker for use in components and actions
export function checkCrudPermission(
  user: any,
  resource: string,
  operation: CrudOperation
): boolean {
  if (isSuperAdmin(user)) return true

  const userPermissions = getUserPermissions(user)
  
  // Check specific permission
  const specificPermission = `${operation}_${resource}`
  if (userPermissions.includes(specificPermission)) return true

  // Check manage permission
  const managePermission = `manage_${resource}`
  if (userPermissions.includes(managePermission)) return true

  return false
}
