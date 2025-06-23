// lib/auth.ts
import type { User, Role } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "./prisma"
import bcrypt from "bcryptjs"

// Extended user type for authentication (updated for new schema)
export type AuthUser = User & {
  role: Role
  permissions: string[] // Direct permissions array from User model
}

// Get current authenticated user from database
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return null
    }

    // Get the complete user data from the database
    const user = await findUserById(session.user.id)

    if (!user) {
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Find user by ID with all relations (updated for new schema)
async function findUserById(id: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true, // Just include the role, no complex permissions relation
      },
    })

    if (!user) {
      return null
    }

    return user as AuthUser
  } catch (error) {
    console.error("Error finding user by ID:", error)
    return null
  }
}

// Find user by email for authentication (updated for new schema)
export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true // Simple role include
      },
    })

    if (!user) {
      return null
    }

    return user as AuthUser
  } catch (error) {
    console.error("Error finding user by email:", error)
    return null
  }
}

// Authenticate user with email and password
export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await findUserByEmail(email)
    
    if (!user || !user.password) {
      return null
    }

    // Compare password
    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      return null
    }

    return user
  } catch (error) {
    console.error("Error authenticating user:", error)
    return null
  }
}

// Login function (for compatibility with existing code)
export async function login(email: string, password: string) {
  try {
    const user = await authenticateUser(email, password)

    if (!user) {
      return { success: false, message: "Invalid email or password" }
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image || `https://avatar.vercel.sh/${user.name.toLowerCase().replace(" ", "-")}.png`,
        role: user.role,
        permissions: user.permissions,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "Login failed" }
  }
}

// Logout function
export async function logout() {
  return { success: true }
}

// Get all users from database (for admin purposes)
export async function getUsers(): Promise<AuthUser[]> {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return users.map(user => ({
      ...user,
      image: user.image || `https://avatar.vercel.sh/${user.name.toLowerCase().replace(" ", "-")}.png`,
    })) as AuthUser[]
  } catch (error) {
    console.error("Error getting users:", error)
    throw new Error("Failed to fetch users")
  }
}

// Create a new user in database
export async function createUser(userData: {
  name: string
  email: string
  password: string
  roleId: string
  image?: string
  permissions?: string[] // Optional direct permissions
}): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      return { success: false, message: "Email already in use" }
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: userData.roleId }
    })

    if (!role) {
      return { success: false, message: "Invalid role selected" }
    }

    // Hash the password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds)

    // Create user with new schema
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        roleId: userData.roleId,
        image: userData.image || null,
        permissions: userData.permissions || [], // Set permissions array
      },
      include: {
        role: true,
      },
    })

    return {
      success: true,
      user: {
        ...newUser,
        image: newUser.image || `https://avatar.vercel.sh/${newUser.name.toLowerCase().replace(" ", "-")}.png`,
      } as AuthUser,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, message: "Failed to create user" }
  }
}

// Update an existing user in database
export async function updateUser(
  userId: string,
  userData: {
    name?: string
    email?: string
    password?: string
    roleId?: string
    image?: string
    permissions?: string[] // Update permissions array
  },
): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return { success: false, message: "User not found" }
    }

    // If email is being updated, check for conflicts
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { 
          email: userData.email,
          NOT: { id: userId }
        }
      })

      if (emailExists) {
        return { success: false, message: "Email already in use" }
      }
    }

    // If roleId is being updated, verify it exists
    if (userData.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: userData.roleId }
      })

      if (!role) {
        return { success: false, message: "Invalid role selected" }
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (userData.name !== undefined) updateData.name = userData.name
    if (userData.email !== undefined) updateData.email = userData.email
    if (userData.roleId !== undefined) updateData.roleId = userData.roleId
    if (userData.image !== undefined) updateData.image = userData.image
    if (userData.permissions !== undefined) updateData.permissions = userData.permissions

    // Hash password if provided
    if (userData.password && userData.password.trim() !== "") {
      const saltRounds = 12
      updateData.password = await bcrypt.hash(userData.password, saltRounds)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
      },
    })

    return {
      success: true,
      user: {
        ...updatedUser,
        image: updatedUser.image || `https://avatar.vercel.sh/${updatedUser.name.toLowerCase().replace(" ", "-")}.png`,
      } as AuthUser,
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, message: "Failed to update user" }
  }
}

// Delete a user from database
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Check if user exists and get role info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      }
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Prevent deletion of the last Super Admin
    if (user.role.name === "Super Admin") {
      const superAdminCount = await prisma.user.count({
        where: {
          role: {
            name: "Super Admin"
          }
        }
      })

      if (superAdminCount <= 1) {
        return { 
          success: false, 
          message: "Cannot delete the last Super Admin. Create another Super Admin first." 
        }
      }
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, message: "Failed to delete user" }
  }
}

// Update user role (for compatibility)
export async function updateUserRole(userId: string, roleId: string) {
  const result = await updateUser(userId, { roleId })
  return result
}

// Update user permissions in database (simplified for new schema)
export async function updateUserPermissions(
  userId: string, 
  permissions: string[]
): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return { success: false, message: "User not found" }
    }

    // Update user permissions directly in the user record
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        permissions: permissions // Simply update the permissions array
      },
      include: {
        role: true,
      },
    })

    return {
      success: true,
      user: updatedUser as AuthUser,
    }
  } catch (error) {
    console.error("Error updating user permissions:", error)
    return { success: false, message: "Failed to update user permissions" }
  }
}

// Helper function to check if user is super admin
export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role?.name === "Super Admin"
}

// Helper function to get user permissions (updated for new schema)
export function getUserPermissions(user: AuthUser): string[] {
  if (!user) return []

  // Super Admin has all permissions
  if (isSuperAdmin(user)) {
    // Return comprehensive permissions list for super admin
    return [
      "SYSTEM.ADMIN",
      "SYSTEM.USER_MANAGEMENT",
      "SYSTEM.ROLE_MANAGEMENT",
      "SYSTEM.SETTINGS",
      "article.ALL",
      "author.ALL",
      "category.ALL",
      "media.ALL",
      "journalissue.ALL",
      "callforpapers.ALL",
      "notification.ALL",
      "editorialboardmember.ALL",
      "user.ALL",
      "role.ALL"
    ]
  }

  // Get permissions from the user's role (now just an array)
  const rolePermissions = user.role.permissions || []

  // Get direct permissions assigned to the user (now just an array)
  const directPermissions = user.permissions || []

  // Combine and deduplicate permissions
  return [...new Set([...rolePermissions, ...directPermissions])]
}

// Helper function to check if user has specific permission (updated)
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false

  // Super Admin has all permissions
  if (isSuperAdmin(user)) return true

  // Check if the user has the specific permission
  const userPermissions = getUserPermissions(user)
  return userPermissions.includes(permission)
}

// New helper functions for the updated permission system

// Check if user has any permission that starts with a prefix
export function hasPermissionPrefix(user: AuthUser | null, prefix: string): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  
  const userPermissions = getUserPermissions(user)
  return userPermissions.some(permission => permission.startsWith(prefix))
}

// Check if user has system-level permission
export function hasSystemPermission(user: AuthUser | null, systemPermission: string): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  
  const userPermissions = getUserPermissions(user)
  return userPermissions.includes(`SYSTEM.${systemPermission}`) || 
         userPermissions.includes('SYSTEM.ADMIN')
}

// Check if user can manage other users
export function canManageUsers(user: AuthUser | null): boolean {
  return hasSystemPermission(user, 'USER_MANAGEMENT') || isSuperAdmin(user)
}

// Check if user can manage roles
export function canManageRoles(user: AuthUser | null): boolean {
  return hasSystemPermission(user, 'ROLE_MANAGEMENT') || isSuperAdmin(user)
}

// Get user's effective permissions for a specific table
export function getTablePermissions(user: AuthUser | null, tableName: string): string[] {
  if (!user) return []
  if (isSuperAdmin(user)) return ['CREATE', 'READ', 'UPDATE', 'DELETE', 'ALL']
  
  const userPermissions = getUserPermissions(user)
  return userPermissions
    .filter(permission => permission.startsWith(`${tableName}.`))
    .map(permission => permission.split('.')[1])
}