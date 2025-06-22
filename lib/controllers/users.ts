import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function getUsers() {
  try {
    return await prisma.user.findMany({
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        permissions: true,
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
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        permissions: true,
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
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        permissions: true,
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
  image?: string
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
        image: data.image || null,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        permissions: true,
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
    image?: string
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
    if (data.image !== undefined) updateData.image = data.image

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
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        permissions: true,
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
        throw new Error("Cannot delete the last Super Admin. Create another Super Admin first.")
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

export async function updateUserPermissions(userId: string, permissions: string[]) {
  try {
    // Check if user exists
    await getUserById(userId)

    // First, remove all existing permissions for this user
    await prisma.permission.deleteMany({
      where: { userId }
    })

    // Then, add new permissions if any
    if (permissions.length > 0) {
      await prisma.permission.createMany({
        data: permissions.map(permission => ({
          name: permission,
          userId
        }))
      })
    }

    // Return updated user
    return await getUserById(userId)
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
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error("Error fetching roles:", error)
    throw new Error("Failed to fetch roles")
  }
}