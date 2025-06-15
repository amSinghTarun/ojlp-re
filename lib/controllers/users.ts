import prisma from "../prisma"
import { hashPassword, comparePassword } from "../auth-utils"

export async function getUsers() {
  return prisma.user.findMany({
    include: {
      role: true,
      permissions: true,
    },
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      permissions: true,
    },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
      permissions: true,
    },
  })
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  roleId: string
  image?: string
  permissions?: string[]
}) {
  const { permissions, ...userData } = data

  // Hash the password
  const hashedPassword = await hashPassword(userData.password)

  return prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      permissions: {
        create: permissions?.map((name) => ({ name })) || [],
      },
    },
    include: {
      role: true,
      permissions: true,
    },
  })
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
  // If password is being updated, hash it
  if (data.password) {
    data.password = await hashPassword(data.password)
  }

  return prisma.user.update({
    where: { id },
    data,
    include: {
      role: true,
      permissions: true,
    },
  })
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  })
}

export async function updateUserPermissions(userId: string, permissions: string[]) {
  // First delete existing permissions
  await prisma.permission.deleteMany({
    where: { userId },
  })

  // Then create new permissions
  return prisma.user.update({
    where: { id: userId },
    data: {
      permissions: {
        create: permissions.map((name) => ({ name })),
      },
    },
    include: {
      role: true,
      permissions: true,
    },
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
      permissions: true,
    },
  })

  if (!user) return null

  const passwordValid = await comparePassword(password, user.password)
  if (!passwordValid) return null

  // Don't return the password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}
