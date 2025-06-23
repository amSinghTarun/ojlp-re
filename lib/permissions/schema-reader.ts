// lib/permissions/schema-reader.ts - FIXED VERSION
export interface PermissionOption {
  value: string
  label: string
  description: string
  category: string
}

// Manual permission definitions based on your actual schema
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