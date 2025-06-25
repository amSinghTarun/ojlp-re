// lib/actions/user-actions.ts
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

// Validation schemas
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(255, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long").optional(),
  roleId: z.string().min(1, "Role is required"),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
})

const createUserSchema = userSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
})

const updateUserSchema = userSchema.partial().extend({
  id: z.string(),
})

// Get all users
export async function getUsers() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !checkPermission(currentUser, "")) {
      return { users: null, error: "Unauthorized access" }
    }

    const users = await getUsersFromDB()
    return { users, error: null }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { 
      users: null, 
      error: error instanceof Error ? error.message : "Failed to fetch users" 
    }
  }
}

// Get single user by ID
export async function getUser(id: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { user: null, error: "Unauthorized access" }
    }

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return { user: null, error: "Invalid user ID" }
    }

    const user = await getUserByIdFromDB(id)
    return { user, error: null }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { 
      user: null, 
      error: error instanceof Error ? error.message : "Failed to fetch user" 
    }
  }
}

// Create new user
export async function createUser(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      roleId: formData.get("roleId") as string,
      image: (formData.get("image") as string) || undefined,
    }

    // Validate data
    const validatedData = createUserSchema.parse(rawData)

    // Additional role assignment checks
    if (!isSuperAdmin(currentUser)) {
      // Get the role details to check if non-super admin can assign it
      const roles = await getRolesFromDB()
      const selectedRole = roles.find(role => role.id === validatedData.roleId)
      
      if (selectedRole?.name === "Super Admin") {
        return { 
          success: false, 
          error: "You don't have permission to create Super Admin users" 
        }
      }
    }

    // Create user
    const newUser = await createUserInDB(validatedData)

    // Revalidate relevant pages
    revalidatePath("/admin/users")
    
    return { 
      success: true, 
      error: null,
      user: newUser
    }
  } catch (error) {
    console.error("Error creating user:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(err => err.message).join(", ")
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create user" 
    }
  }
}

// Update existing user
export async function updateUser(id: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Validate ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid user ID" }
    }

    // Get existing user to validate permissions
    const existingUser = await getUserByIdFromDB(id)

    // Check if current user can edit this user
    if (!isSuperAdmin(currentUser)) {
      if (existingUser.role.name === "Super Admin") {
        return { 
          success: false, 
          error: "You don't have permission to edit Super Admin users" 
        }
      }
    }

    // Prevent self-editing through this interface (should use profile settings)
    if (id === currentUser.id) {
      return { 
        success: false, 
        error: "Use your profile settings to edit your own account" 
      }
    }

    // Extract form data
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      roleId: formData.get("roleId") as string,
      image: (formData.get("image") as string) || undefined,
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

    // Additional role assignment checks
    if (validatedData.roleId && !isSuperAdmin(currentUser)) {
      const roles = await getRolesFromDB()
      const selectedRole = roles.find(role => role.id === validatedData.roleId)
      
      if (selectedRole?.name === "Super Admin") {
        return { 
          success: false, 
          error: "You don't have permission to assign Super Admin role" 
        }
      }
    }

    // Update user
    const updatedUser = await updateUserInDB(id, validatedData)

    // Revalidate relevant pages
    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${id}/edit`)
    
    return { 
      success: true, 
      error: null,
      user: updatedUser
    }
  } catch (error) {
    console.error("Error updating user:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(err => err.message).join(", ")
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update user" 
    }
  }
}

// Delete user
export async function deleteUser(id: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Validate ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid user ID" }
    }

    // Get existing user to validate permissions
    const existingUser = await getUserByIdFromDB(id)

    // Check if current user can delete this user
    if (!isSuperAdmin(currentUser)) {
      if (existingUser.role.name === "Super Admin") {
        return { 
          success: false, 
          error: "You don't have permission to delete Super Admin users" 
        }
      }
    }

    // Prevent self-deletion
    if (id === currentUser.id) {
      return { 
        success: false, 
        error: "You cannot delete your own account" 
      }
    }

    // Delete user (controller handles last Super Admin check)
    await deleteUserInDB(id)

    // Revalidate pages
    revalidatePath("/admin/users")
    
    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete user" 
    }
  }
}

// Update user permissions
export async function updateUserPermissions(userId: string, permissions: string[]) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_PERMISSIONS)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: "Invalid user ID" }
    }

    if (!Array.isArray(permissions)) {
      return { success: false, error: "Invalid permissions data" }
    }

    // Get existing user to validate permissions
    const existingUser = await getUserByIdFromDB(userId)

    // Check if current user can manage permissions for this user
    if (!isSuperAdmin(currentUser)) {
      if (existingUser.role.name === "Super Admin") {
        return { 
          success: false, 
          error: "You cannot modify permissions for Super Admin users" 
        }
      }
    }

    // Update permissions
    const updatedUser = await updateUserPermissionsInDB(userId, permissions)

    // Revalidate pages
    revalidatePath("/admin/users")
    revalidatePath("/admin/permissions")
    
    return { 
      success: true, 
      error: null,
      user: updatedUser
    }
  } catch (error) {
    console.error("Error updating user permissions:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update user permissions" 
    }
  }
}

// Get available roles
export async function getRoles() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { roles: null, error: "Unauthorized access" }
    }

    const roles = await getRolesFromDB()
    
    // Filter roles based on current user permissions
    const assignableRoles = roles.filter(role => {
      // Super Admin can assign any role
      if (isSuperAdmin(currentUser)) return true
      
      // Regular admins cannot assign Super Admin roles
      if (role.name === "Super Admin") return false
      
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