"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getHighPriorityNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        read: false,
        priority: "high",
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    return notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      date: notification.date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      type: notification.type,
      priority: notification.priority,
      read: notification.read,
      link: notification.link,
      expiresAt: notification.expiresAt?.toISOString(),
      image: notification.image,
    }))
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return []
  }
}

export async function getAllNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    return notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      date: notification.date.toISOString(), // Keep as ISO string for date-fns
      type: notification.type.replace(/_/g, '-'), // Convert underscores to hyphens
      priority: notification.priority,
      read: notification.read,
      link: notification.link,
      expiresAt: notification.expiresAt?.toISOString(),
      image: notification.image,
    }))
  } catch (error) {
    console.error("Failed to fetch all notifications:", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}