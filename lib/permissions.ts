// lib/permissions.ts
import type { User, Role, Permission } from "@prisma/client"

// Extended user type for permissions
export type AuthUser = User & {
  role: Role & {
    permissions: Array<{
      permission: Permission
    }>
  }
  permissions: Permission[]
}

// Define all possible permissions in the system
export const PERMISSIONS = {
  // Content management
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_POSTS: "manage_posts",
  MANAGE_AUTHORS: "manage_authors",
  MANAGE_JOURNALS: "manage_journals",
  MANAGE_ARTICLES: "manage_articles",
  MANAGE_CALL_FOR_PAPERS: "manage_call_for_papers",
  MANAGE_NOTIFICATIONS: "manage_notifications",
  MANAGE_MEDIA: "manage_media",
  MANAGE_EDITORIAL_BOARD: "manage_editorial_board",
  MANAGE_BOARD_ADVISORS: "manage_board_advisors",

  // User management
  MANAGE_USERS: "manage_users",
  ASSIGN_ROLES: "assign_roles",

  // Role management (super admin only)
  MANAGE_ROLES: "manage_roles",
  MANAGE_PERMISSIONS: "manage_permissions",
} as const

// Define route permissions mapping
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin": PERMISSIONS.VIEW_DASHBOARD,
  "/admin/posts": PERMISSIONS.MANAGE_POSTS,
  "/admin/authors": PERMISSIONS.MANAGE_AUTHORS,
  "/admin/journals": PERMISSIONS.MANAGE_JOURNALS,
  "/admin/journal-articles": PERMISSIONS.MANAGE_ARTICLES,
  "/admin/call-for-papers": PERMISSIONS.MANAGE_CALL_FOR_PAPERS,
  "/admin/notifications": PERMISSIONS.MANAGE_NOTIFICATIONS,
  "/admin/media": PERMISSIONS.MANAGE_MEDIA,
  "/admin/editorial-board": PERMISSIONS.MANAGE_EDITORIAL_BOARD,
  "/admin/board-advisors": PERMISSIONS.MANAGE_BOARD_ADVISORS,
  "/admin/users": PERMISSIONS.MANAGE_USERS,
  "/admin/roles": PERMISSIONS.MANAGE_ROLES,
  "/admin/permissions": PERMISSIONS.MANAGE_PERMISSIONS,
}

// Check if user is a super admin
export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role?.name === "Super Admin"
}

// Helper function to get all permissions for a user (synchronous)
export function getUserPermissions(user: AuthUser): string[] {
  if (!user) return []

  // Super Admin has all permissions
  if (isSuperAdmin(user)) {
    return Object.values(PERMISSIONS)
  }

  // Get permissions from the user's role
  const rolePermissions = user.role.permissions.map((rp) => rp.permission.name)

  // Get direct permissions assigned to the user
  const directPermissions = user.permissions.map((p) => p.name)

  // Combine and deduplicate permissions
  return [...new Set([...rolePermissions, ...directPermissions])]
}

// Check if user has specific permission (synchronous)
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false

  // Super Admin has all permissions
  if (isSuperAdmin(user)) return true

  // Check if the user has the specific permission
  const userPermissions = getUserPermissions(user)
  return userPermissions.includes(permission)
}

// Check if user has permission to access a specific route
export function hasRoutePermission(user: AuthUser | null, route: string): boolean {
  // Super Admin has access to all routes
  if (isSuperAdmin(user)) return true

  // If the route doesn't have a specific permission requirement, allow access
  if (!ROUTE_PERMISSIONS[route]) return true

  // Check if the user has permission for this route
  return hasPermission(user, ROUTE_PERMISSIONS[route])
}

// Check if user has any of the given permissions
export function hasAnyPermission(user: AuthUser | null, permissions: string[]): boolean {
  // Super Admin has all permissions
  if (isSuperAdmin(user)) return true

  const userPermissions = getUserPermissions(user!)
  return permissions.some((permission) => userPermissions.includes(permission))
}

// Check if user has all of the given permissions
export function hasAllPermissions(user: AuthUser | null, permissions: string[]): boolean {
  // Super Admin has all permissions
  if (isSuperAdmin(user)) return true

  const userPermissions = getUserPermissions(user!)
  return permissions.every((permission) => userPermissions.includes(permission))
}

// Check if user can assign a specific role
export function canAssignRole(user: AuthUser | null, roleToAssign: Role): boolean {
  if (!user) return false

  // Super Admin can assign any role
  if (isSuperAdmin(user)) return true

  // Check if user has permission to assign roles
  const hasAssignPermission = hasPermission(user, PERMISSIONS.ASSIGN_ROLES)
  if (!hasAssignPermission) return false

  // Regular admins cannot assign Super Admin roles
  if (roleToAssign.name === "Super Admin") return false

  return true
}

// Get all available routes with their permission requirements
export function getAllRoutePermissions(): Array<{ route: string; permission: string; description: string }> {
  return Object.entries(ROUTE_PERMISSIONS).map(([route, permission]) => {
    // Generate a human-readable description
    const description = permission
      .replace("manage_", "Manage ")
      .replace("view_", "View ")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    return {
      route,
      permission,
      description,
    }
  })
}

// Get all available permissions with descriptions
export function getAllPermissions(): Array<{ id: string; name: string }> {
  return Object.entries(PERMISSIONS).map(([key, value]) => {
    // Generate a human-readable name
    const name = key
      .replace("MANAGE_", "Manage ")
      .replace("VIEW_", "View ")
      .replace("ASSIGN_", "Assign ")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    return {
      id: value,
      name,
    }
  })
}

// Role hierarchy for comparison
export const ROLE_HIERARCHY = {
  "Viewer": 1,
  "Author": 2,
  "Editor": 3,
  "Admin": 4,
  "Super Admin": 5,
} as const

// Check if user can manage another user based on role hierarchy
export function canManageUser(currentUser: AuthUser | null, targetUser: AuthUser): boolean {
  if (!currentUser) return false

  // Super Admin can manage anyone except themselves
  if (isSuperAdmin(currentUser)) {
    return currentUser.id !== targetUser.id
  }

  // Users cannot manage themselves through admin interface
  if (currentUser.id === targetUser.id) return false

  // Regular admins cannot manage super admins
  if (isSuperAdmin(targetUser)) return false

  // Check if user has manage users permission
  return hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)
}

// Check if user can delete another user
export function canDeleteUser(currentUser: AuthUser | null, targetUser: AuthUser): boolean {
  if (!currentUser) return false

  // Users cannot delete themselves
  if (currentUser.id === targetUser.id) return false

  // Super Admin can delete anyone except themselves
  if (isSuperAdmin(currentUser)) return true

  // Regular admins cannot delete super admins
  if (isSuperAdmin(targetUser)) return false

  // Check if user has manage users permission
  return hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)
}

// Check if user can edit another user
export function canEditUser(currentUser: AuthUser | null, targetUser: AuthUser): boolean {
  if (!currentUser) return false

  // Users cannot edit themselves through admin interface (should use profile)
  if (currentUser.id === targetUser.id) return false

  // Super Admin can edit anyone except themselves
  if (isSuperAdmin(currentUser)) return true

  // Regular admins cannot edit super admins
  if (isSuperAdmin(targetUser)) return false

  // Check if user has manage users permission
  return hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)
}

// Get assignable roles for a user
export function getAssignableRoles(currentUser: AuthUser | null, allRoles: Role[]): Role[] {
  if (!currentUser) return []

  return allRoles.filter(role => {
    // Super Admin can assign any role
    if (isSuperAdmin(currentUser)) return true
    
    // Regular admins cannot assign Super Admin roles
    if (role.name === "Super Admin") return false
    
    // Check if user has permission to assign roles
    return hasPermission(currentUser, PERMISSIONS.ASSIGN_ROLES)
  })
}