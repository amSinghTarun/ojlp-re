// lib/permissions/schema-reader.ts - COMPLETE VERSION with all database models
export interface PermissionOption {
  value: string
  label: string
  description: string
  category: string
}

// Complete permission definitions based on your actual Prisma schema
const MANUAL_PERMISSIONS: Record<string, PermissionOption[]> = {
  "System": [
    {
      value: "SYSTEM.ADMIN",
      label: "System Administrator", 
      description: "Full system access (bypasses all other permissions)",
      category: "System"
    },
    {
      value: "SYSTEM.USER_MANAGEMENT",
      label: "User Management",
      description: "Manage users and their permissions", 
      category: "System"
    },
    {
      value: "SYSTEM.ROLE_MANAGEMENT", 
      label: "Role Management",
      description: "Create and manage roles and permissions",
      category: "System"
    }
  ],
  "User": [
    {
      value: "user.CREATE",
      label: "Create Users",
      description: "Create new user accounts",
      category: "User"
    },
    {
      value: "user.READ", 
      label: "View Users",
      description: "View user information",
      category: "User"
    },
    {
      value: "user.UPDATE",
      label: "Edit Users", 
      description: "Edit existing user accounts",
      category: "User"
    },
    {
      value: "user.DELETE",
      label: "Delete Users",
      description: "Delete user accounts", 
      category: "User"
    },
    {
      value: "user.ALL",
      label: "All User Operations",
      description: "Full access to user management",
      category: "User"
    }
  ],
  "Role": [
    {
      value: "role.CREATE",
      label: "Create Roles",
      description: "Create new roles",
      category: "Role"
    },
    {
      value: "role.READ",
      label: "View Roles", 
      description: "View role information",
      category: "Role"
    },
    {
      value: "role.UPDATE",
      label: "Edit Roles",
      description: "Edit existing roles",
      category: "Role"
    },
    {
      value: "role.DELETE", 
      label: "Delete Roles",
      description: "Delete roles",
      category: "Role"
    },
    {
      value: "role.ALL",
      label: "All Role Operations", 
      description: "Full access to role management",
      category: "Role"
    }
  ],
  "Article": [
    {
      value: "article.CREATE",
      label: "Create Articles",
      description: "Create new articles",
      category: "Article"
    },
    {
      value: "article.READ",
      label: "View Articles",
      description: "View articles", 
      category: "Article"
    },
    {
      value: "article.UPDATE",
      label: "Edit Articles",
      description: "Edit existing articles",
      category: "Article"
    },
    {
      value: "article.DELETE",
      label: "Delete Articles", 
      description: "Delete articles",
      category: "Article"
    },
    {
      value: "article.ALL",
      label: "All Article Operations",
      description: "Full access to article management",
      category: "Article"
    }
  ],
  "Author": [
    {
      value: "author.CREATE",
      label: "Create Authors",
      description: "Create new author profiles",
      category: "Author"
    },
    {
      value: "author.READ",
      label: "View Authors",
      description: "View author information",
      category: "Author" 
    },
    {
      value: "author.UPDATE",
      label: "Edit Authors",
      description: "Edit existing author profiles", 
      category: "Author"
    },
    {
      value: "author.DELETE",
      label: "Delete Authors",
      description: "Delete author profiles",
      category: "Author"
    },
    {
      value: "author.ALL",
      label: "All Author Operations",
      description: "Full access to author management",
      category: "Author"
    }
  ],
  "Media": [
    {
      value: "media.CREATE",
      label: "Upload Media",
      description: "Upload new media files",
      category: "Media"
    },
    {
      value: "media.READ", 
      label: "View Media",
      description: "View media files",
      category: "Media"
    },
    {
      value: "media.UPDATE",
      label: "Edit Media",
      description: "Edit media information",
      category: "Media"
    },
    {
      value: "media.DELETE",
      label: "Delete Media", 
      description: "Delete media files",
      category: "Media"
    },
    {
      value: "media.ALL",
      label: "All Media Operations",
      description: "Full access to media management",
      category: "Media"
    }
  ],
  "Category": [
    {
      value: "category.CREATE",
      label: "Create Categories",
      description: "Create new article categories",
      category: "Category"
    },
    {
      value: "category.READ",
      label: "View Categories",
      description: "View category information",
      category: "Category"
    },
    {
      value: "category.UPDATE",
      label: "Edit Categories",
      description: "Edit existing categories",
      category: "Category"
    },
    {
      value: "category.DELETE",
      label: "Delete Categories",
      description: "Delete categories",
      category: "Category"
    },
    {
      value: "category.ALL",
      label: "All Category Operations",
      description: "Full access to category management",
      category: "Category"
    }
  ],
  "Journal Issue": [
    {
      value: "journalissue.CREATE",
      label: "Create Journal Issues",
      description: "Create new journal issues",
      category: "Journal Issue"
    },
    {
      value: "journalissue.READ",
      label: "View Journal Issues",
      description: "View journal issue information",
      category: "Journal Issue"
    },
    {
      value: "journalissue.UPDATE",
      label: "Edit Journal Issues",
      description: "Edit existing journal issues",
      category: "Journal Issue"
    },
    {
      value: "journalissue.DELETE",
      label: "Delete Journal Issues",
      description: "Delete journal issues",
      category: "Journal Issue"
    },
    {
      value: "journalissue.ALL",
      label: "All Journal Issue Operations",
      description: "Full access to journal issue management",
      category: "Journal Issue"
    }
  ],
  "Call for Papers": [
    {
      value: "callforpapers.CREATE",
      label: "Create Call for Papers",
      description: "Create new call for papers",
      category: "Call for Papers"
    },
    {
      value: "callforpapers.READ",
      label: "View Call for Papers",
      description: "View call for papers information",
      category: "Call for Papers"
    },
    {
      value: "callforpapers.UPDATE",
      label: "Edit Call for Papers",
      description: "Edit existing call for papers",
      category: "Call for Papers"
    },
    {
      value: "callforpapers.DELETE",
      label: "Delete Call for Papers",
      description: "Delete call for papers",
      category: "Call for Papers"
    },
    {
      value: "callforpapers.ALL",
      label: "All Call for Papers Operations",
      description: "Full access to call for papers management",
      category: "Call for Papers"
    }
  ],
  "Editorial Board": [
    {
      value: "editorialboard.CREATE",
      label: "Add Board Members",
      description: "Add new editorial board members",
      category: "Editorial Board"
    },
    {
      value: "editorialboard.READ",
      label: "View Board Members",
      description: "View editorial board member information",
      category: "Editorial Board"
    },
    {
      value: "editorialboard.UPDATE",
      label: "Edit Board Members",
      description: "Edit existing editorial board members",
      category: "Editorial Board"
    },
    {
      value: "editorialboard.DELETE",
      label: "Remove Board Members",
      description: "Remove editorial board members",
      category: "Editorial Board"
    },
    {
      value: "editorialboard.ALL",
      label: "All Editorial Board Operations",
      description: "Full access to editorial board management",
      category: "Editorial Board"
    }
  ],
  "Notifications": [
    {
      value: "notification.CREATE",
      label: "Create Notifications",
      description: "Create new notifications",
      category: "Notifications"
    },
    {
      value: "notification.READ",
      label: "View Notifications",
      description: "View notifications",
      category: "Notifications"
    },
    {
      value: "notification.UPDATE",
      label: "Edit Notifications",
      description: "Edit existing notifications",
      category: "Notifications"
    },
    {
      value: "notification.DELETE",
      label: "Delete Notifications",
      description: "Delete notifications",
      category: "Notifications"
    },
    {
      value: "notification.ALL",
      label: "All Notification Operations",
      description: "Full access to notification management",
      category: "Notifications"
    }
  ]
}

// Simple functions that return the manual permissions
export function generateAllPermissions(): PermissionOption[] {
  console.log("🔄 generateAllPermissions called")
  const result = Object.values(MANUAL_PERMISSIONS).flat()
  console.log("✅ generateAllPermissions result:", result.length, "permissions")
  return result
}

export function groupPermissionsByTable(): Record<string, PermissionOption[]> {
  console.log("🔄 groupPermissionsByTable called")
  console.log("✅ groupPermissionsByTable result:", Object.keys(MANUAL_PERMISSIONS))
  return MANUAL_PERMISSIONS
}

// Permission validation helper
export function isValidPermissionString(permission: string): boolean {
  const allPermissions = generateAllPermissions()
  return allPermissions.some(p => p.value === permission)
}

export function getTableNameFromRoute(routePath: string): string | null {
  // Simple implementation that extracts table name from route
  const pathParts = routePath.split('/').filter(Boolean)
  if (pathParts.length >= 2 && pathParts[0] === 'admin') {
    const tablePart = pathParts[1]
    
    // Map route names to permission table names
    const routeMapping: Record<string, string> = {
      'users': 'user',
      'roles': 'role',
      'articles': 'article',
      'authors': 'author',
      'media': 'media',
      'categories': 'category',
      'journal-issues': 'journalissue',
      'call-for-papers': 'callforpapers',
      'editorial-board': 'editorialboard',
      'notifications': 'notification',
      'sessions': 'session',
      'analytics': 'analytics',
      'settings': 'settings'
    }
    
    return routeMapping[tablePart] || tablePart
  }
  return null
}

// Get permissions for a specific table
export function getTablePermissions(tableName: string): PermissionOption[] {
  const normalizedTableName = Object.keys(MANUAL_PERMISSIONS).find(
    key => key.toLowerCase().replace(/\s+/g, '') === tableName.toLowerCase().replace(/\s+/g, '')
  )
  
  if (normalizedTableName) {
    return MANUAL_PERMISSIONS[normalizedTableName] || []
  }
  
  return []
}

// Check if a permission exists
export function permissionExists(permissionValue: string): boolean {
  const allPermissions = generateAllPermissions()
  return allPermissions.some(p => p.value === permissionValue)
}

// Get permission details
export function getPermissionDetails(permissionValue: string): PermissionOption | null {
  const allPermissions = generateAllPermissions()
  return allPermissions.find(p => p.value === permissionValue) || null
}