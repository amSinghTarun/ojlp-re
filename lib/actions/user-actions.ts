// lib/actions/user-actions.ts - Updated for simplified schema
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  getUsers as getUsersFromDB,
  getUserById as getUserByIdFromDB,
  createUser as createUserInDB,
  updateUser as updateUserInDB,
  deleteUser as deleteUserInDB,
  updateUserPermissions as updateUserPermissionsInDB,
  getRoles as getRolesFromDB,
} from "@/lib/controllers/users"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  SYSTEM_PERMISSIONS, 
  PERMISSION_ERRORS,
  PermissionContext
} from "@/lib/permissions/types"
import { prisma } from "@/lib/prisma"

// Response helpers
function createSuccessResponse<T>(data: T, message?: string) {
  return { success: true as const, data, message }
}

function createErrorResponse(error: string) {
  return { success: false as const, error }
}

// Get current user with permissions helper
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

// Validation schemas - Updated to remove image field
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(255, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long").optional(),
  roleId: z.string().min(1, "Role is required"),
  permissions: z.array(z.string()).optional().default([]), // Added permissions field
})

const createUserSchema = userSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
})

const updateUserSchema = userSchema.partial().extend({
  id: z.string(),
})

/**
 * Get all users
 * Requires: SYSTEM.USER_MANAGEMENT or user.READ permission
 */
export async function getUsers() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { users: null, error: PERMISSION_ERRORS.UNAUTHORIZED }
    }

    // Check if user has permission to view users
    const userManagementCheck = checkPermission(currentUser, SYSTEM_PERMISSIONS.USER_MANAGEMENT)
    const userReadCheck = checkPermission(currentUser, 'user.READ')
    
    if (!userManagementCheck.allowed && !userReadCheck.allowed) {
      return { users: null, error: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS }
    }

    const users = await getUsersFromDB()
    
    // Filter system users if user doesn't have system admin access
    const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
    const filteredUsers = hasSystemAccess.allowed 
      ? users 
      : users.filter(user => user.role?.name !== "SUPER_ADMIN")

    return { users: filteredUsers, error: null }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { 
      users: null, 
      error: error instanceof Error ? error.message : "Failed to fetch users" 
    }
  }
}

/**
 * Get single user by ID
 * Requires: SYSTEM.USER_MANAGEMENT or user.READ permission
 * Additional context: Users can read their own profile
 */
export async function getUser(id: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { user: null, error: PERMISSION_ERRORS.UNAUTHORIZED }
    }

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return { user: null, error: "Invalid user ID" }
    }

    // Check permission with context (users can read their own profile)
    const context: PermissionContext = { 
      resourceId: id,
      userId: currentUser.id 
    }
    
    const permissionCheck = checkPermission(currentUser, 'user.READ', context)
    if (!permissionCheck.allowed) {
      return { user: null, error: permissionCheck.reason || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS }
    }

    const user = await getUserByIdFromDB(id)
    
    // Additional check: non-system admins can't view SUPER_ADMIN users
    if (user && user.role?.name === "SUPER_ADMIN") {
      const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
      if (!hasSystemAccess.allowed) {
        return { user: null, error: "Access denied to system user" }
      }
    }

    return { user, error: null }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { 
      user: null, 
      error: error instanceof Error ? error.message : "Failed to fetch user" 
    }
  }
}

/**
 * Create new user
 * Requires: SYSTEM.USER_MANAGEMENT or user.CREATE permission
 */
export async function createUser(formData: FormData) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return createErrorResponse(PERMISSION_ERRORS.UNAUTHORIZED)
    }

    // Check if user has permission to create users
    const userManagementCheck = checkPermission(currentUser, SYSTEM_PERMISSIONS.USER_MANAGEMENT)
    const userCreateCheck = checkPermission(currentUser, 'user.CREATE')
    
    if (!userManagementCheck.allowed && !userCreateCheck.allowed) {
      return createErrorResponse(PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS)
    }

    // Extract and validate form data - removed image field
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      roleId: formData.get("roleId") as string,
      permissions: [], // Initialize with empty permissions, will be inherited from role
    }

    // Validate data
    const validatedData = createUserSchema.parse(rawData)

    // Check role assignment permissions
    if (validatedData.roleId) {
      const roles = await getRolesFromDB()
      const selectedRole = roles.find(role => role.id === validatedData.roleId)
      
      if (selectedRole) {
        // Check if user can assign this specific role
        if (selectedRole.isSystem || selectedRole.name === "SUPER_ADMIN") {
          const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
          if (!hasSystemAccess.allowed) {
            return createErrorResponse("Only system administrators can assign system roles")
          }
        }
      }
    }

    // Create user
    const newUser = await createUserInDB(validatedData)

    // Revalidate relevant pages
    revalidatePath("/admin/users")
    
    return createSuccessResponse(newUser, "User created successfully")
  } catch (error) {
    console.error("Error creating user:", error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors.map(err => err.message).join(", "))
    }
    
    return createErrorResponse(error instanceof Error ? error.message : "Failed to create user")
  }
}

/**
 * Update existing user
 * Requires: SYSTEM.USER_MANAGEMENT or user.UPDATE permission
 * Additional context: Users can update their own profile
 */
export async function updateUser(id: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return createErrorResponse(PERMISSION_ERRORS.UNAUTHORIZED)
    }

    // Validate ID
    if (!id || typeof id !== 'string') {
      return createErrorResponse("Invalid user ID")
    }

    // Check permission with context (users can update their own profile)
    const context: PermissionContext = { 
      resourceId: id,
      userId: currentUser.id 
    }
    
    const permissionCheck = checkPermission(currentUser, 'user.UPDATE', context)
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS)
    }

    // Get existing user to validate additional constraints
    const existingUser = await getUserByIdFromDB(id)
    if (!existingUser) {
      return createErrorResponse("User not found")
    }

    // Additional protection for system users
    if (existingUser.role?.name === "SUPER_ADMIN") {
      const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
      if (!hasSystemAccess.allowed) {
        return createErrorResponse("Only system administrators can edit system users")
      }
    }

    // Extract form data - removed image field
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      roleId: formData.get("roleId") as string,
    }

    // Only include password if it's provided and not empty
    const password = formData.get("password") as string
    if (password && password.trim() !== "") {
      rawData["password"] = password
    }

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(rawData).filter(([_, value]) => value !== undefined && value !== "")
    )

    // Validate data (excluding id for now)
    const validatedData = updateUserSchema.omit({ id: true }).parse(cleanData)

    // Check role assignment permissions
    if (validatedData.roleId) {
      const roles = await getRolesFromDB()
      const selectedRole = roles.find(role => role.id === validatedData.roleId)
      
      if (selectedRole) {
        // Check if user can assign this specific role
        if (selectedRole.isSystem || selectedRole.name === "SUPER_ADMIN") {
          const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
          if (!hasSystemAccess.allowed) {
            return createErrorResponse("Only system administrators can assign system roles")
          }
        }
      }
    }

    // Update user
    const updatedUser = await updateUserInDB(id, validatedData)

    // Revalidate relevant pages
    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${id}/edit`)
    
    return createSuccessResponse(updatedUser, "User updated successfully")
  } catch (error) {
    console.error("Error updating user:", error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(error.errors.map(err => err.message).join(", "))
    }
    
    return createErrorResponse(error instanceof Error ? error.message : "Failed to update user")
  }
}

/**
 * Delete user
 * Requires: SYSTEM.USER_MANAGEMENT or user.DELETE permission
 */
export async function deleteUser(id: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return createErrorResponse(PERMISSION_ERRORS.UNAUTHORIZED)
    }

    // Check if user has permission to delete users
    const userManagementCheck = checkPermission(currentUser, SYSTEM_PERMISSIONS.USER_MANAGEMENT)
    const userDeleteCheck = checkPermission(currentUser, 'user.DELETE')
    
    if (!userManagementCheck.allowed && !userDeleteCheck.allowed) {
      return createErrorResponse(PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS)
    }

    // Validate ID
    if (!id || typeof id !== 'string') {
      return createErrorResponse("Invalid user ID")
    }

    // Get existing user to validate permissions
    const existingUser = await getUserByIdFromDB(id)
    if (!existingUser) {
      return createErrorResponse("User not found")
    }

    // Additional protection for system users
    if (existingUser.role?.name === "SUPER_ADMIN") {
      const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
      if (!hasSystemAccess.allowed) {
        return createErrorResponse("Only system administrators can delete system users")
      }
    }

    // Prevent self-deletion
    if (id === currentUser.id) {
      return createErrorResponse("You cannot delete your own account")
    }

    // Delete user (controller handles last SUPER_ADMIN check)
    await deleteUserInDB(id)

    // Revalidate pages
    revalidatePath("/admin/users")
    
    return createSuccessResponse(null, "User deleted successfully")
  } catch (error) {
    console.error("Error deleting user:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to delete user")
  }
}

/**
 * Update user permissions
 * Requires: SYSTEM.USER_MANAGEMENT permission (this is a sensitive operation)
 */
export async function updateUserPermissions(userId: string, permissions: string[]) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return createErrorResponse(PERMISSION_ERRORS.UNAUTHORIZED)
    }

    // For permission management, require system-level access
    const permissionCheck = checkPermission(currentUser, SYSTEM_PERMISSIONS.USER_MANAGEMENT)
    if (!permissionCheck.allowed) {
      return createErrorResponse(permissionCheck.reason || PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS)
    }

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      return createErrorResponse("Invalid user ID")
    }

    if (!Array.isArray(permissions)) {
      return createErrorResponse("Invalid permissions data")
    }

    // Get existing user to validate permissions
    const existingUser = await getUserByIdFromDB(userId)
    if (!existingUser) {
      return createErrorResponse("User not found")
    }

    // Additional protection for system users
    if (existingUser.role?.name === "SUPER_ADMIN") {
      const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
      if (!hasSystemAccess.allowed) {
        return createErrorResponse("Only system administrators can modify permissions for system users")
      }
    }

    // Check if user can assign system-level permissions
    const systemPermissions = permissions.filter(permission => permission.startsWith('SYSTEM.'))
    if (systemPermissions.length > 0) {
      const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
      if (!hasSystemAccess.allowed) {
        return createErrorResponse("Only system administrators can assign system-level permissions")
      }
    }

    // Update permissions
    const updatedUser = await updateUserPermissionsInDB(userId, permissions)

    // Revalidate pages
    revalidatePath("/admin/users")
    revalidatePath("/admin/permissions")
    
    return createSuccessResponse(updatedUser, "User permissions updated successfully")
  } catch (error) {
    console.error("Error updating user permissions:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to update user permissions")
  }
}

/**
 * Get available roles
 * Requires: SYSTEM.USER_MANAGEMENT or role.READ permission
 */
export async function getRoles() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      return { roles: null, error: PERMISSION_ERRORS.UNAUTHORIZED }
    }

    // Check if user has permission to view roles
    const userManagementCheck = checkPermission(currentUser, SYSTEM_PERMISSIONS.USER_MANAGEMENT)
    const roleReadCheck = checkPermission(currentUser, 'role.READ')
    
    if (!userManagementCheck.allowed && !roleReadCheck.allowed) {
      return { roles: null, error: PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS }
    }

    const roles = await getRolesFromDB()
    
    // Filter roles based on current user permissions
    const hasSystemAccess = checkPermission(currentUser, SYSTEM_PERMISSIONS.ADMIN)
    
    const assignableRoles = roles.filter(role => {
      // System admin can assign any role
      if (hasSystemAccess.allowed) return true
      
      // Regular users cannot assign system roles
      if (role.isSystem || role.name === "SUPER_ADMIN") return false
      
      return true
    })

    return { roles: assignableRoles, error: null }
  } catch (error) {
    console.error("Error fetching roles:", error)
    return { 
      roles: null, 
      error: error instanceof Error ? error.message : "Failed to fetch roles" 
    }
  }
}

/**
 * Helper function to check if user can manage another user
 * This is used for additional business logic validation
 */
export async function canManageUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser || currentUser.id !== currentUserId) return false

    // Users cannot manage themselves through admin interface
    if (currentUserId === targetUserId) return false

    // Check basic permission
    const permissionCheck = checkPermission(currentUser, SYSTEM_PERMISSIONS.USER_MANAGEMENT)
    if (permissionCheck.allowed) return true

    // Check if they have user management permissions
    const userManageCheck = checkPermission(currentUser, 'user.UPDATE')
    return userManageCheck.allowed
  } catch (error) {
    console.error("Error checking user management permissions:", error)
    return false
  }
}

/**
 * Helper function to check if user can delete another user
 */
export async function canDeleteUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser || currentUser.id !== currentUserId) return false

    // Users cannot delete themselves
    if (currentUserId === targetUserId) return false

    // Check permission
    const permissionCheck = checkPermission(currentUser, 'user.DELETE')
    return permissionCheck.allowed
  } catch (error) {
    console.error("Error checking user deletion permissions:", error)
    return false
  }
}