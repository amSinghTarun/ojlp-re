// lib/controllers/notifications.ts
'use server'

import prisma from "@/lib/prisma"
import { NotificationType } from "@prisma/client"

export async function getNotifications() {
  return prisma.notification.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getActiveNotifications() {
  const now = new Date()

  return prisma.notification.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getNotificationById(id: string) {
  return prisma.notification.findUnique({
    where: { id },
  })
}

export async function createNotification(data: {
  title: string
  content: string
  type: string
  priority?: "low" | "medium" | "high"
  linkDisplay?: string
  linkUrl?: string
  expiresAt?: Date | null
}) {
  return prisma.notification.create({
    data: {
      ...data,
      priority: data.priority || "medium",
      type: data.type as NotificationType,
    },
  })
}

export async function updateNotification(
  id: string,
  data: {
    title?: string
    content?: string
    type?: NotificationType
    priority?: "low" | "medium" | "high"
    linkDisplay?: string
    linkUrl?: string
    expiresAt?: Date | null
  },
) {
  return prisma.notification.update({
    where: { id },
    data,
  })
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({
    where: { id },
  })
}

export async function getNotificationsByType(type: NotificationType) {
  return prisma.notification.findMany({
    where: { 
      type,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getNotificationsByPriority(priority: "low" | "medium" | "high") {
  return prisma.notification.findMany({
    where: { 
      priority,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getExpiredNotifications() {
  return prisma.notification.findMany({
    where: {
      expiresAt: { lt: new Date() },
    },
    orderBy: {
      expiresAt: "desc",
    },
  })
}

export async function cleanupExpiredNotifications() {
  const result = await prisma.notification.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  
  return result.count
}

export async function getNotificationStats() {
  const total = await prisma.notification.count()
  const active = await prisma.notification.count({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  const expired = await prisma.notification.count({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  const byPriority = await prisma.notification.groupBy({
    by: ['priority'],
    _count: {
      priority: true,
    },
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
  const byType = await prisma.notification.groupBy({
    by: ['type'],
    _count: {
      type: true,
    },
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })

  return {
    total,
    active,
    expired,
    byPriority: byPriority.reduce((acc, item) => {
      acc[item.priority] = item._count.priority
      return acc
    }, {} as Record<string, number>),
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count.type
      return acc
    }, {} as Record<string, number>),
  }
}