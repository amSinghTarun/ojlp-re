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
  link?: string
  image?: string
  expiresAt?: Date | null
}) {
  return prisma.notification.create({
    data: {
      ...data,
      date: new Date(),
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
    link?: string
    image?: string
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

export async function markNotificationAsRead(id: string, userId: string) {
  return prisma.notification.update({
    where: { id },
    data: {
      read: true,
    },
  })
}