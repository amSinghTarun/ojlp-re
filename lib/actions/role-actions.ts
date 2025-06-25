// lib/actions/role-actions.ts - COMPLETE VERSION
"use server"

import { 
  getRolesWithPermissions, 
  getRoleById, 
  createRoleWithPermissions,
  updateRolePermissions,
  deleteRole,
  duplicateRole
} from './role-permission-actions'

// Complete permissions that match your schema.prisma file
const WORKING_PERMISSIONS = {
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
    },
    {
      value: "SYSTEM.SETTINGS",
      label: "System Settings",
      description: "Access and modify system settings",
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
      value: "article.PUBLISH",
      label: "Publish Articles",
      description: "Publish and unpublish articles",
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
  "CallForPapers": [
    {
      value: "callforpapers.CREATE",
      label: "Create Call for Papers",
      description: "Create new call for papers",
      category: "CallForPapers"
    },
    {
      value: "callforpapers.READ",
      label: "View Call for Papers",
      description: "View call for papers",
      category: "CallForPapers"
    },
    {
      value: "callforpapers.UPDATE",
      label: "Edit Call for Papers",
      description: "Edit existing call for papers",
      category: "CallForPapers"
    },
    {
      value: "callforpapers.DELETE",
      label: "Delete Call for Papers",
      description: "Delete call for papers",
      category: "CallForPapers"
    },
    {
      value: "callforpapers.ALL",
      label: "All Call for Papers Operations",
      description: "Full access to call for papers management",
      category: "CallForPapers"
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
      description: "View article categories",
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
      description: "Delete article categories",
      category: "Category"
    },
    {
      value: "category.ALL",
      label: "All Category Operations",
      description: "Full access to category management",
      category: "Category"
    }
  ],
  "EditorialBoardMember": [
    {
      value: "editorialboardmember.CREATE",
      label: "Add Board Members",
      description: "Add new editorial board members",
      category: "EditorialBoardMember"
    },
    {
      value: "editorialboardmember.READ",
      label: "View Board Members",
      description: "View editorial board members",
      category: "EditorialBoardMember"
    },
    {
      value: "editorialboardmember.UPDATE",
      label: "Edit Board Members",
      description: "Edit editorial board member information",
      category: "EditorialBoardMember"
    },
    {
      value: "editorialboardmember.DELETE",
      label: "Remove Board Members",
      description: "Remove editorial board members",
      category: "EditorialBoardMember"
    },
    {
      value: "editorialboardmember.ALL",
      label: "All Board Member Operations",
      description: "Full access to editorial board management",
      category: "EditorialBoardMember"
    }
  ],
  "JournalIssue": [
    {
      value: "journalissue.CREATE",
      label: "Create Journal Issues",
      description: "Create new journal issues",
      category: "JournalIssue"
    },
    {
      value: "journalissue.READ",
      label: "View Journal Issues",
      description: "View journal issues",
      category: "JournalIssue"
    },
    {
      value: "journalissue.UPDATE",
      label: "Edit Journal Issues",
      description: "Edit existing journal issues",
      category: "JournalIssue"
    },
    {
      value: "journalissue.DELETE",
      label: "Delete Journal Issues",
      description: "Delete journal issues",
      category: "JournalIssue"
    },
    {
      value: "journalissue.PUBLISH",
      label: "Publish Journal Issues",
      description: "Publish and manage journal issue releases",
      category: "JournalIssue"
    },
    {
      value: "journalissue.ALL",
      label: "All Journal Issue Operations",
      description: "Full access to journal issue management",
      category: "JournalIssue"
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
  "Notification": [
    {
      value: "notification.CREATE",
      label: "Create Notifications",
      description: "Create new system notifications",
      category: "Notification"
    },
    {
      value: "notification.READ",
      label: "View Notifications",
      description: "View system notifications",
      category: "Notification"
    },
    {
      value: "notification.UPDATE",
      label: "Edit Notifications",
      description: "Edit existing notifications",
      category: "Notification"
    },
    {
      value: "notification.DELETE",
      label: "Delete Notifications",
      description: "Delete system notifications",
      category: "Notification"
    },
    {
      value: "notification.SEND",
      label: "Send Notifications",
      description: "Send notifications to users",
      category: "Notification"
    },
    {
      value: "notification.ALL",
      label: "All Notification Operations",
      description: "Full access to notification management",
      category: "Notification"
    }
  ]
}

export async function getRoles() {
  try {
    console.log("🔄 getRoles bridge called")
    const result = await getRolesWithPermissions()
    
    if (!result.success) {
      console.log("❌ getRolesWithPermissions failed:", result.error)
      return { roles: null, error: result.error }
    }

    const rolesWithCounts = result.data.map(role => ({
      ...role,
      userCount: role.users?.length || 0,
      isSystemRole: role.isSystem || false
    }))

    console.log("✅ getRoles bridge success:", rolesWithCounts.length, "roles")
    return { roles: rolesWithCounts, error: null }
  } catch (error) {
    console.error("❌ getRoles bridge error:", error)
    return { 
      roles: null, 
      error: error instanceof Error ? error.message : "Failed to fetch roles" 
    }
  }
}

export async function getRole(roleId: string) {
  try {
    console.log("🔄 getRole bridge called for:", roleId)
    const result = await getRoleById(roleId)
    
    if (!result.success) {
      console.log("❌ getRoleById failed:", result.error)
      return { role: null, error: result.error }
    }

    const role = {
      ...result.data,
      userCount: result.data.users?.length || 0,
      isSystemRole: result.data.isSystem || false
    }

    console.log("✅ getRole bridge success:", role.name)
    return { role, error: null }
  } catch (error) {
    console.error("❌ getRole bridge error:", error)
    return { 
      role: null, 
      error: error instanceof Error ? error.message : "Failed to fetch role" 
    }
  }
}

export async function getPermissions() {
  try {
    console.log("🔄 getPermissions bridge called - using complete hardcoded permissions")
    
    // Calculate totals for logging
    const totalPermissions = Object.values(WORKING_PERMISSIONS).reduce((total, perms) => total + perms.length, 0)
    
    console.log("✅ getPermissions bridge success:", {
      tableCount: Object.keys(WORKING_PERMISSIONS).length,
      tables: Object.keys(WORKING_PERMISSIONS),
      totalPermissions,
      samplePermission: WORKING_PERMISSIONS.System[0]
    })

    // Return the complete hardcoded permissions
    return { 
      permissions: WORKING_PERMISSIONS, 
      error: null 
    }
  } catch (error) {
    console.error("❌ getPermissions bridge error:", error)
    return { 
      permissions: null, 
      error: error instanceof Error ? error.message : "Failed to fetch permissions" 
    }
  }
}

// Re-export other functions
export { createRoleWithPermissions, updateRolePermissions, deleteRole, duplicateRole }