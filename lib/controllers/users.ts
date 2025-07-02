// lib/controllers/users.ts - Updated for simplified schema
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function getUsers() {
  try {
    return await prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error("Failed to fetch users")
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return user
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    throw error
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    })
  } catch (error) {
    console.error("Error fetching user by email:", error)
    throw error
  }
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  roleId: string
  permissions?: string[] // Optional direct permissions
}) {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new Error("A user with this email already exists")
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId }
    })

    if (!role) {
      throw new Error("Invalid role selected")
    }

    // Hash the password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(data.password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        roleId: data.roleId,
        permissions: data.permissions || [], // Set permissions array
      },
      include: {
        role: true,
      },
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(
  id: string,
  data: {
    name?: string
    email?: string
    password?: string
    roleId?: string
    permissions?: string[] // Optional direct permissions
  },
) {
  try {
    // Check if user exists
    const existingUser = await getUserById(id)
    
    // If email is being updated, check for conflicts
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { 
          email: data.email,
          NOT: { id }
        }
      })

      if (emailExists) {
        throw new Error("A user with this email already exists")
      }
    }

    // If roleId is being updated, verify it exists
    if (data.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: data.roleId }
      })

      if (!role) {
        throw new Error("Invalid role selected")
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.roleId !== undefined) updateData.roleId = data.roleId
    if (data.permissions !== undefined) updateData.permissions = data.permissions

    // Hash password if provided
    if (data.password && data.password.trim() !== "") {
      const saltRounds = 12
      updateData.password = await bcrypt.hash(data.password, saltRounds)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(id: string) {
  try {
    // Check if user exists and get role info
    const user = await getUserById(id)
    
    // Prevent deletion of the last SUPER_ADMIN
    if (user.role.name === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: {
          role: {
            name: "SUPER_ADMIN"
          }
        }
      })

      if (superAdminCount <= 1) {
        throw new Error("Cannot delete the last SUPER_ADMIN. Create another SUPER_ADMIN first.")
      }
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

/**
 * Update user permissions directly
 */
export async function updateUserPermissions(userId: string, permissions: string[]) {
  try {
    // Check if user exists
    const existingUser = await getUserById(userId)

    // Update user permissions directly
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        permissions: permissions // Update the permissions array
      },
      include: {
        role: true,
      },
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  } catch (error) {
    console.error("Error updating user permissions:", error)
    throw error
  }
}

export async function authenticateUser(email: string, password: string) {
  try {
    const user = await getUserByEmail(email)
    
    if (!user || !user.password) {
      return null
    }

    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      return null
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error authenticating user:", error)
    return null
  }
}

// Helper function to get roles for dropdown
export async function getRoles() {
  try {
    return await prisma.role.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error("Error fetching roles:", error)
    throw new Error("Failed to fetch roles")
  }
}