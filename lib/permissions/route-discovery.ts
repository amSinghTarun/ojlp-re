import fs from 'fs'
import path from 'path'

// CRUD operation types
export const CRUD_OPERATIONS = {
  VIEW: 'view',
  CREATE: 'create', 
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage' // Full CRUD access
} as const

export type CrudOperation = typeof CRUD_OPERATIONS[keyof typeof CRUD_OPERATIONS]

// Route structure interface
export interface RouteInfo {
  path: string
  segment: string
  hasIndex: boolean
  hasNew: boolean
  hasEdit: boolean
  hasDelete: boolean
  isDynamic: boolean
  permissions: {
    view: string
    create: string
    edit: string
    delete: string
    manage: string
  }
}

// Discover all admin routes from filesystem
export function discoverAdminRoutes(): RouteInfo[] {
  const adminPath = path.join(process.cwd(), 'app/admin')
  const routes: RouteInfo[] = []

  function scanDirectory(dirPath: string, relativePath: string = ''): void {
    if (!fs.existsSync(dirPath)) return

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    // Group entries
    const directories = entries.filter(entry => entry.isDirectory())
    const files = entries.filter(entry => entry.isFile() && entry.name.endsWith('.tsx'))

    // Check for route files in current directory
    const hasIndex = files.some(file => file.name === 'page.tsx')
    const hasNew = directories.some(dir => dir.name === 'new') || 
                   files.some(file => file.name === 'new.tsx')
    
    // Check for dynamic routes
    const dynamicDirs = directories.filter(dir => dir.name.startsWith('[') && dir.name.endsWith(']'))
    const hasEdit = dynamicDirs.some(dir => {
      const dynamicPath = path.join(dirPath, dir.name)
      return fs.existsSync(path.join(dynamicPath, 'edit')) ||
             fs.readdirSync(dynamicPath).some(file => file === 'edit.tsx')
    })

    // Skip root admin directory
    if (relativePath) {
      const segment = relativePath.split('/').pop() || ''
      const route: RouteInfo = {
        path: `/admin${relativePath}`,
        segment,
        hasIndex,
        hasNew,
        hasEdit,
        hasDelete: hasEdit, // Assume delete is available if edit exists
        isDynamic: dynamicDirs.length > 0,
        permissions: {
          view: `view_${segment}`,
          create: `create_${segment}`,
          edit: `edit_${segment}`,
          delete: `delete_${segment}`,
          manage: `manage_${segment}`
        }
      }
      routes.push(route)
    }

    // Recursively scan subdirectories (but skip dynamic route directories for now)
    directories
      .filter(dir => !dir.name.startsWith('[') && !dir.name.startsWith('_'))
      .forEach(dir => {
        const newPath = path.join(dirPath, dir.name)
        const newRelativePath = relativePath ? `${relativePath}/${dir.name}` : `/${dir.name}`
        scanDirectory(newPath, newRelativePath)
      })
  }

  scanDirectory(adminPath)
  return routes
}

// Generate permission names based on routes
export function generatePermissionsFromRoutes(): Array<{
  name: string
  description: string
  route: string
  operation: CrudOperation
}> {
  const routes = discoverAdminRoutes()
  const permissions: Array<{
    name: string
    description: string
    route: string
    operation: CrudOperation
  }> = []

  routes.forEach(route => {
    const segment = route.segment
    const displayName = segment.replace(/-/g, ' ').replace(/_/g, ' ')
    
    // Always add view permission if route has index
    if (route.hasIndex) {
      permissions.push({
        name: `view_${segment}`,
        description: `View ${displayName}`,
        route: route.path,
        operation: CRUD_OPERATIONS.VIEW
      })
    }

    // Add create permission if route has new
    if (route.hasNew) {
      permissions.push({
        name: `create_${segment}`,
        description: `Create ${displayName}`,
        route: `${route.path}/new`,
        operation: CRUD_OPERATIONS.CREATE
      })
    }

    // Add edit permission if route has edit
    if (route.hasEdit) {
      permissions.push({
        name: `edit_${segment}`,
        description: `Edit ${displayName}`,
        route: `${route.path}/[id]/edit`,
        operation: CRUD_OPERATIONS.EDIT
      })
    }

    // Add delete permission if route has delete capability
    if (route.hasDelete) {
      permissions.push({
        name: `delete_${segment}`,
        description: `Delete ${displayName}`,
        route: route.path,
        operation: CRUD_OPERATIONS.DELETE
      })
    }

    // Add manage permission (full CRUD)
    permissions.push({
      name: `manage_${segment}`,
      description: `Full access to ${displayName}`,
      route: route.path,
      operation: CRUD_OPERATIONS.MANAGE
    })
  })

  return permissions
}
