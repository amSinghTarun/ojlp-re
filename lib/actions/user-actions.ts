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
} from "@/lib/controllers/users"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS, isSuperAdmin } from "@/lib/permissions"

// Schema for user creation/update
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  roleId: z.string().min(1, "Role is required"),
  image: z.string().optional(),
})

// Schema for user creation (password required)
const createUserSchema = userSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Schema for user update (password optional)
const updateUserSchema = userSchema.partial().extend({
  id: z.string(),
})

export async function getUsers() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { users: null, error: "Unauthorized" }
    }

    const users = await getUsersFromDB()
    return { users, error: null }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { users: null, error: "Failed to fetch users" }
  }
}

export async function getUser(id: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { user: null, error: "Unauthorized" }
    }

    const user = await getUserByIdFromDB(id)
    if (!user) {
      return { user: null, error: "User not found" }
    }

    return { user, error: null }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { user: null, error: "Failed to fetch user" }
  }
}

export async function createUser(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { success: false, error: "Unauthorized" }
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      roleId: formData.get("roleId") as string,
      image: (formData.get("image") as string) || undefined,
    }

    // Validate data with required password
    const validatedData = createUserSchema.parse(rawData)

    // Check if email already exists
    const existingUser = await getUsersFromDB()
    if (existingUser.some(user => user.email === validatedData.email)) {
      return { success: false, error: "A user with this email already exists" }
    }

    // Additional role assignment checks
    if (!isSuperAdmin(currentUser)) {
      // Non-super admins cannot create super admin users
      // You might want to add role validation here based on your role structure
    }

    // Create user
    const newUser = await createUserInDB(validatedData)

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
    return { success: false, error: "Failed to create user" }
  }
}

export async function updateUser(id: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { success: false, error: "Unauthorized" }
    }

    // Get existing user
    const existingUser = await getUserByIdFromDB(id)
    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Check if current user can edit this user
    if (!isSuperAdmin(currentUser) && existingUser.role.name === "Super Admin") {
      return { success: false, error: "You cannot edit a Super Admin" }
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

    // Validate data
    const validatedData = updateUserSchema.omit({ id: true }).parse(rawData)

    // Check if email is being changed and already exists
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const users = await getUsersFromDB()
      if (users.some(user => user.email === validatedData.email && user.id !== id)) {
        return { success: false, error: "A user with this email already exists" }
      }
    }

    // Additional role assignment checks
    if (!isSuperAdmin(currentUser) && validatedData.roleId) {
      // Non-super admins cannot assign super admin role
      // Add additional role validation logic here if needed
    }

    // Update user
    const updatedUser = await updateUserInDB(id, validatedData)

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
    return { success: false, error: "Failed to update user" }
  }
}

export async function deleteUser(id: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return { success: false, error: "Unauthorized" }
    }

    // Get existing user
    const existingUser = await getUserByIdFromDB(id)
    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Check if user can delete this user
    if (!isSuperAdmin(currentUser) && existingUser.role.name === "Super Admin") {
      return { success: false, error: "You cannot delete a Super Admin" }
    }

    // Prevent self-deletion
    if (id === currentUser.id) {
      return { success: false, error: "You cannot delete your own account" }
    }

    // Check if this is the last Super Admin
    if (existingUser.role.name === "Super Admin") {
      const users = await getUsersFromDB()
      const superAdmins = users.filter(user => user.role.name === "Super Admin")
      if (superAdmins.length <= 1) {
        return { 
          success: false, 
          error: "Cannot delete the last Super Admin. Create another Super Admin first." 
        }
      }
    }

    // Delete user
    await deleteUserInDB(id)

    revalidatePath("/admin/users")
    
    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function updateUserPermissions(userId: string, permissions: string[]) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_PERMISSIONS)) {
      return { success: false, error: "Unauthorized" }
    }

    // Get existing user
    const existingUser = await getUserByIdFromDB(userId)
    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Check if user can manage permissions for this user
    if (!isSuperAdmin(currentUser) && existingUser.role.name === "Super Admin") {
      return { success: false, error: "You cannot modify permissions for a Super Admin" }
    }

    // Update permissions
    const updatedUser = await updateUserPermissionsInDB(userId, permissions)

    revalidatePath("/admin/users")
    revalidatePath("/admin/permissions")
    
    return { 
      success: true, 
      error: null,
      user: updatedUser
    }
  } catch (error) {
    console.error("Error updating user permissions:", error)
    return { success: false, error: "Failed to update user permissions" }
  }
}

// Action to get current user (for client components)
export async function getCurrentUserData() {
  try {
    const user = await getCurrentUser()
    return { user, error: null }
  } catch (error) {
    console.error("Error getting current user:", error)
    return { user: null, error: "Failed to get current user" }
  }
}

// Action to change user password
export async function changeUserPassword(userId: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, error: "Unauthorized" }
    }

    // Users can change their own password, or admins can change others
    const canChangePassword = userId === currentUser.id || 
      hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)

    if (!canChangePassword) {
      return { success: false, error: "You don't have permission to change this password" }
    }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate passwords
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters" }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "New password and confirmation do not match" }
    }

    // For self-password change, verify current password
    if (userId === currentUser.id && !currentPassword) {
      return { success: false, error: "Current password is required" }
    }

    // Update password
    await updateUserInDB(userId, { password: newPassword })

    revalidatePath("/admin/users")
    
    return { success: true, error: null }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, error: "Failed to change password" }
  }
}