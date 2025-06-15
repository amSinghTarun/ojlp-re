"use server"

import { revalidatePath } from "next/cache"
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

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      roleId: formData.get("roleId") as string,
      image: (formData.get("image") as string) || undefined,
    }

    // Validate data
    const validatedData = userSchema.parse(data)

    // Check if user can assign this role
    if (!isSuperAdmin(currentUser)) {
      // Add role assignment check here if needed
    }

    // Create user
    await createUserInDB(validatedData)

    revalidatePath("/admin/users")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating user:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
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

    // Check if user can edit this user
    if (!isSuperAdmin(currentUser) && existingUser.role.name === "Super Admin") {
      return { success: false, error: "You cannot edit a Super Admin" }
    }

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      roleId: formData.get("roleId") as string,
      image: (formData.get("image") as string) || undefined,
    }

    // Only include password if it's provided and not empty
    const password = formData.get("password") as string
    if (password && password.trim() !== "") {
      data["password"] = password
    }

    // Validate data
    const validatedData = userSchema.partial().parse(data)

    // Check if user can assign this role
    if (!isSuperAdmin(currentUser)) {
      // Add role assignment check here if needed
    }

    // Update user
    await updateUserInDB(id, validatedData)

    revalidatePath("/admin/users")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating user:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
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
    await updateUserPermissionsInDB(userId, permissions)

    revalidatePath("/admin/users")
    revalidatePath("/admin/permissions")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating user permissions:", error)
    return { success: false, error: "Failed to update user permissions" }
  }
}
