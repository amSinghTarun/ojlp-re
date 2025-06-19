// lib/actions/role-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  getRoles as getRolesFromDB,
  getRoleById as getRoleByIdFromDB,
  createRole as createRoleInDB,
  updateRole as updateRoleInDB,
  deleteRole as deleteRoleInDB,
  getPermissions as getPermissionsFromDB,
} from "@/lib/controllers/roles"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"

// Validation schemas
const roleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
  description: z.string().max(255, "Description is too long").optional(),
  permissionIds: z.array(z.string()).optional(),
})

const createRoleSchema = roleSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
})

const updateRoleSchema = roleSchema.partial().extend({
  id: z.string(),
})

// Get all roles
export async function getRoles() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { roles: null, error: "Unauthorized access" }
    }

    const roles = await getRolesFromDB()
    
    // Add computed fields
    const rolesWithStats = roles.map(role => ({
      ...role,
      userCount: role.users.length,
      permissionCount: role.permissions.length,
      permissionNames: role.permissions.map(rp => rp.permission.name),
      isSystemRole: role.isSystem,
      canEdit: !role.isSystem || role.name !== "Super Admin",
      canDelete: !role.isSystem && role.users.length === 0,
    }))

    return { roles: rolesWithStats, error: null }
  } catch (error) {
    console.error("Error fetching roles:", error)
    return { 
      roles: null, 
      error: error instanceof Error ? error.message : "Failed to fetch roles" 
    }
  }
}

// Get single role by ID
export async function getRole(id: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { role: null, error: "Unauthorized access" }
    }

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return { role: null, error: "Invalid role ID" }
    }

    const role = await getRoleByIdFromDB(id)
    
    // Add computed fields
    const roleWithStats = {
      ...role,
      userCount: role.users.length,
      permissionCount: role.permissions.length,
      permissionNames: role.permissions.map(rp => rp.permission.name),
      isSystemRole: role.isSystem,
      canEdit: !role.isSystem || role.name !== "Super Admin",
      canDelete: !role.isSystem && role.users.length === 0,
    }

    return { role: roleWithStats, error: null }
  } catch (error) {
    console.error("Error fetching role:", error)
    return { 
      role: null, 
      error: error instanceof Error ? error.message : "Failed to fetch role" 
    }
  }
}

// Create new role
export async function createRole(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      permissionIds: formData.getAll("permissionIds") as string[],
    }

    // Validate data
    const validatedData = createRoleSchema.parse(rawData)

    // Create role
    const newRole = await createRoleInDB(validatedData)

    // Revalidate relevant pages
    revalidatePath("/admin/roles")
    
    return { 
      success: true, 
      error: null,
      role: newRole
    }
  } catch (error) {
    console.error("Error creating role:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(err => err.message).join(", ")
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create role" 
    }
  }
}

// Update existing role
export async function updateRole(id: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Validate ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid role ID" }
    }

    // Extract form data
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      permissionIds: formData.getAll("permissionIds") as string[],
    }

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(rawData).filter(([_, value]) => {
        if (Array.isArray(value)) return true // Keep arrays even if empty
        return value !== undefined && value !== "" && value !== null
      })
    )

    // Validate data (excluding id for now)
    const validatedData = updateRoleSchema.omit({ id: true }).parse(cleanData)

    // Update role
    const updatedRole = await updateRoleInDB(id, validatedData)

    // Revalidate relevant pages
    revalidatePath("/admin/roles")
    revalidatePath(`/admin/roles/${id}/edit`)
    
    return { 
      success: true, 
      error: null,
      role: updatedRole
    }
  } catch (error) {
    console.error("Error updating role:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(err => err.message).join(", ")
      }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update role" 
    }
  }
}

// Delete role
export async function deleteRole(id: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "Unauthorized access" }
    }

    // Validate ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid role ID" }
    }

    // Delete role (controller handles validation)
    await deleteRoleInDB(id)

    // Revalidate pages
    revalidatePath("/admin/roles")
    
    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting role:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete role" 
    }
  }
}

// Get available permissions
export async function getPermissions() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { permissions: null, error: "Unauthorized access" }
    }

    const permissions = await getPermissionsFromDB()
    return { permissions, error: null }
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return { 
      permissions: null, 
      error: error instanceof Error ? error.message : "Failed to fetch permissions" 
    }
  }
}