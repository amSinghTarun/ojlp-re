"use server"
import prisma from "@/lib/prisma"
import { NotificationType } from "@prisma/client"

// Add these functions to your existing notification-actions.ts file

export async function updateExistingNotification(
  notificationId: string,
  data: {
    title?: string
    content?: string
    type?: any
    priority?: any
    read?: boolean
    link?: string | null
    image?: string | null
    expiresAt?: Date | null
  }
) {
  try {
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return { success: true, data: updatedNotification }
  } catch (error) {
    console.error("Failed to update notification:", error)
    return { success: false, error: "Failed to update notification" }
  }
}

export async function deleteExistingNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId }
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to delete notification:", error)
    return { success: false, error: "Failed to delete notification" }
  }
}

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
    return { success: true, data: notifications.map(notification => ({
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
    })) }
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

export async function getNotificationById(id: string) {
  try{
    const notification = await prisma.notification.findUnique({
      where: { id },
    })
    return { success: true, data: notification }
  } catch(error) {
    console.error("Failed to mark notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
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
  try{
    const notification = await prisma.notification.create({
    data: {
      ...data,
      date: new Date(),
      priority: data.priority || "medium",
      type: data.type as NotificationType,
    },
  })
  return { success: true, data: notification }
  } catch(error) {
    console.error("Failed to create notification:", error)
    return { success: false, error: "Failed to create notification" }
  }
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
  try{
    const notification = await prisma.notification.update({
      where: { id },
      data,
    })
    return { success: true, data: notification }
  } catch(error) {
    console.error("Failed to update notification:", error)
    return { success: false, error: "Failed to update notification" }
  }
}