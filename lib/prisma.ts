// lib/prisma.ts - Replace your current prisma setup with this
import { PrismaClient } from '@prisma/client'

// Extend global object to include prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create singleton instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// In development, save the instance to global to prevent re-creation on hot reload
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Optional: Add connection management
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('🔗 Database connected')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function disconnectDB() {
  try {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDB()
})

export default prisma