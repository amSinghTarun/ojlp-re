// lib/actions/permission-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  getPermissions as getPermissionsFromDB,
  getPermissionById as getPermissionByIdFromDB,
  createPermission as createPermissionInDB,
  updatePermission as updatePermissionInDB,
  deletePermission as deletePermissionInDB,
  initializeSystemPermissions as initializeSystemPermissionsInDB,
} from "@/lib/controllers/permissions"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"

// Validation schemas
const permissionSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .regex(/^[a-z_]+$/, "Name must be lowercase with underscores only"),
  description: z.string()
    .max(255, "Description is too long")
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
})

const createPermissionSchema = permissionSchema.extend({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .regex(/^[a-z_]+$/, "Name must be lowercase with underscores only"),
})

const updatePermissionSchema = permissionSchema.partial().extend({
  id: z.string(),
})

// Get all permissions
export async function getPermissions() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { permissions: null, error: "Unauthorized access" }
    }

    const permissions = await getPermissionsFromDB()
    
    // Add computed fields
    const permissionsWithStats = permissions.map(permission => ({
      ...permission,
      roleCount: permission.roles.length,
      userCount: permission.users.length,
      roleNames: permission.roles.map(rp => rp.role.name),
      totalAssignments: permission.roles.length + permission.users.length,
      canDelete: permission.roles.length === 0 && permission.users.length === 0,
    }))

    return { permissions: permissionsWithStats, error: null }
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return { 
      permissions: null, 
      error: error instanceof Error ? error.message : "Failed to fetch permissions" 
    }
  }
}

// Get single permission by ID
export async function getPermission(id: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { permission: null, error: "Unauthorized access" }
    }

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return { permission: null, error: "Invalid permission ID" }
    }

    const permission = await getPermissionByIdFromDB(id)
    
    // Add computed fields
    const permissionWithStats = {
      ...permission,
      roleCount: permission.roles.length,
      userCount: permission.users.length,
      roleNames: permission.roles.map(rp => rp.role.name),
      totalAssignments: permission.roles.length + permission.users.length,
      canDelete: permission.roles.length === 0 && permission.users.length === 0,
      // Calculate total users affected (direct + through roles)
      affectedUsers: new Set([
        ...permission.users.map(u => u.id),
        ...permission.roles.flatMap(rp => rp.role.users?.map(u => u.id) || [])
      ]).size,
    }

    return { permission: permissionWithStats, error: null }
  } catch (error) {
    console.error("Error fetching permission:", error)
    return { 
      permission: null, 
      error: error instanceof Error ? error.message : "Failed to fetch permission" 
    }
  }
}

// Create new permission
export async function createPermission(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string | null,
    }

    // Clean the data - convert null/empty strings to undefined for optional fields
    const cleanData = {
      name: rawData.name?.trim() || "",
      description: rawData.description?.trim() || undefined,
    }

    // Validate data
    const validatedData = createPermissionSchema.parse(cleanData)

    // Create permission
    const newPermission = await createPermissionInDB(validatedData)

    // Revalidate relevant pages
    revalidatePath("/admin/permissions")
    
    return { 
      success: true, 
      error: null,
      permission: newPermission
    }
  } catch (error) {
    console.error("Error creating permission:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(err => err.message).join(", ")
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create permission" 
    }
  }
}

// Update existing permission
export async function updatePermission(id: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Validate ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid permission ID" }
    }

    // Extract form data
    const rawData = {
      name: formData.get("name") as string | null,
      description: formData.get("description") as string | null,
    }

    // Clean the data - remove null/empty values and convert empty strings to undefined
    const cleanData: Record<string, any> = {}
    
    if (rawData.name && rawData.name.trim() !== "") {
      cleanData.name = rawData.name.trim()
    }
    
    if (rawData.description && rawData.description.trim() !== "") {
      cleanData.description = rawData.description.trim()
    }

    // Only proceed if we have data to update
    if (Object.keys(cleanData).length === 0) {
      return { success: false, error: "No data provided for update" }
    }

    // Validate data (excluding id for now)
    const validatedData = updatePermissionSchema.omit({ id: true }).parse(cleanData)

    // Update permission
    const updatedPermission = await updatePermissionInDB(id, validatedData)

    // Revalidate relevant pages
    revalidatePath("/admin/permissions")
    revalidatePath(`/admin/permissions/${id}/edit`)
    
    return { 
      success: true, 
      error: null,
      permission: updatedPermission
    }
  } catch (error) {
    console.error("Error updating permission:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(err => err.message).join(", ")
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update permission" 
    }
  }
}

// Delete permission
export async function deletePermission(id: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Validate ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid permission ID" }
    }

    // Delete permission (controller handles validation)
    await deletePermissionInDB(id)

    // Revalidate pages
    revalidatePath("/admin/permissions")
    
    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting permission:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete permission" 
    }
  }
}

// Initialize system permissions
export async function initializeSystemPermissions() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "Unauthorized access" }
    }

    await initializeSystemPermissionsInDB()

    // Revalidate pages
    revalidatePath("/admin/permissions")
    
    return { success: true, error: null }
  } catch (error) {
    console.error("Error initializing system permissions:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to initialize system permissions" 
    }
  }
}