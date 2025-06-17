import type { User } from "./types"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Mock user data with custom permissions
const users = [
  {
    id: "1",
    name: "Super Admin",
    email: "super@example.com",
    password: "password123", // In a real app, this would be hashed
    role: "SUPER_ADMIN",
    permissions: [], // Super admins have all permissions by default
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    password: "password123", // In a real app, this would be hashed
    role: "ADMIN",
    permissions: [], // Using role-based permissions by default
  },
  {
    id: "3",
    name: "Editor User",
    email: "editor@example.com",
    password: "password123",
    role: "EDITOR",
    permissions: [], // Using role-based permissions by default
  },
  {
    id: "4",
    name: "Author User",
    email: "author@example.com",
    password: "password123",
    role: "AUTHOR",
    permissions: [], // Using role-based permissions by default
  },
  {
    id: "5",
    name: "Viewer User",
    email: "viewer@example.com",
    password: "password123",
    role: "VIEWER",
    permissions: [], // Using role-based permissions by default
  },
  {
    id: "6",
    name: "Custom Admin",
    email: "custom@example.com",
    password: "password123",
    role: "ADMIN",
    permissions: ["manage_posts", "manage_authors", "manage_media"], // Custom permissions
  },
]

// This is a mock implementation for demonstration purposes
export async function getCurrentUser(): Promise<User | null> {
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

    return {
      ...user,
      // Ensure role is properly structured for permission checks
      role: user.role,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function login(email: string, password: string) {
  const user = users.find((u) => u.email === email)

  if (!user || user.password !== password) {
    return { success: false, message: "Invalid email or password" }
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: `https://avatar.vercel.sh/${user.name.toLowerCase().replace(" ", "-")}.png`,
      role: user.role,
      permissions: user.permissions || [],
    },
  }
}

export async function logout() {
  return { success: true }
}

// Get all users (for admin purposes)
export async function getUsers() {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    image: `https://avatar.vercel.sh/${user.name.toLowerCase().replace(" ", "-")}.png`,
  }))
}

// Get user by ID
function findUserById(id: string) {
  const user = users.find((u) => u.id === id)
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    image: `https://avatar.vercel.sh/${user.name.toLowerCase().replace(" ", "-")}.png`,
  }
}

// Update user role (super admin only)
export async function updateUserRole(userId: string, newRole: string) {
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) {
    return { success: false, message: "User not found" }
  }

  // In a real app, you would update the database
  // This is just a mock implementation
  users[userIndex].role = newRole as any

  return {
    success: true,
    user: {
      id: users[userIndex].id,
      name: users[userIndex].name,
      email: users[userIndex].email,
      role: users[userIndex].role,
      permissions: users[userIndex].permissions || [],
    },
  }
}

// Update user permissions
export async function updateUserPermissions(userId: string, permissions: string[]) {
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) {
    return { success: false, message: "User not found" }
  }

  // In a real app, you would update the database
  // This is just a mock implementation
  users[userIndex].permissions = permissions

  return {
    success: true,
    user: {
      id: users[userIndex].id,
      name: users[userIndex].name,
      email: users[userIndex].email,
      role: users[userIndex].role,
      permissions: users[userIndex].permissions,
    },
  }
}

// Create a new user
export async function createUser(userData: {
  name: string
  email: string
  password: string
  role: string
  permissions?: string[]
}) {
  // Check if email already exists
  if (users.some((u) => u.email === userData.email)) {
    return { success: false, message: "Email already in use" }
  }

  // Create new user
  const newUser = {
    id: (users.length + 1).toString(),
    name: userData.name,
    email: userData.email,
    password: userData.password, // In a real app, this would be hashed
    role: userData.role as any,
    permissions: userData.permissions || [],
  }

  // Add to users array (in a real app, this would be a database insert)
  users.push(newUser)

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions,
    },
  }
}

// Update an existing user
export async function updateUser(
  userId: string,
  userData: {
    name?: string
    email?: string
    password?: string
    role?: string
    permissions?: string[]
  },
) {
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) {
    return { success: false, message: "User not found" }
  }

  // Check if email is being changed and already exists
  if (userData.email && userData.email !== users[userIndex].email && users.some((u) => u.email === userData.email)) {
    return { success: false, message: "Email already in use" }
  }

  // Update user data
  users[userIndex] = {
    ...users[userIndex],
    ...userData,
  }

  return {
    success: true,
    user: {
      id: users[userIndex].id,
      name: users[userIndex].name,
      email: users[userIndex].email,
      role: users[userIndex].role,
      permissions: users[userIndex].permissions || [],
    },
  }
}

// Delete a user
export async function deleteUser(userId: string) {
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) {
    return { success: false, message: "User not found" }
  }

  // Remove user from array (in a real app, this would be a database delete)
  users.splice(userIndex, 1)

  return { success: true }
}
