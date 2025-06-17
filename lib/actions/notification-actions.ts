// lib/actions/notification-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { NotificationType, Priority } from "@prisma/client"

const notificationSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(Priority).optional(),
  link: z.string().optional(),
  image: z.string().optional(),
  expiresAt: z.date().optional(),
  date: z.date().optional(),
})

export async function getAllNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
    return { success: true, data: notifications }
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return { success: false, error: "Failed to fetch notifications" }
  }
}

export async function getNotificationById(id: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
    })
    
    if (!notification) {
      return { success: false, error: "Notification not found" }
    }
    
    return { success: true, data: notification }
  } catch (error) {
    console.error(`Failed to fetch notification ${id}:`, error)
    return { success: false, error: "Failed to fetch notification" }
  }
}

export async function createNotification(data: z.infer<typeof notificationSchema>) {
  try {
    const validatedData = notificationSchema.parse(data)
    
    const notification = await prisma.notification.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        priority: validatedData.priority || Priority.medium,
        link: validatedData.link,
        image: validatedData.image,
        expiresAt: validatedData.expiresAt,
        date: validatedData.date || new Date(),
      },
    })
    
    revalidatePath("/admin/notifications")
    return { success: true, data: notification }
  } catch (error) {
    console.error("Failed to create notification:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to create notification" }
  }
}

export async function updateNotification(
  id: string, 
  data: Partial<z.infer<typeof notificationSchema>>
) {
  try {
    const validatedData = notificationSchema.partial().parse(data)
    
    const notification = await prisma.notification.update({
      where: { id },
      data: validatedData,
    })
    
    revalidatePath("/admin/notifications")
    return { success: true, data: notification }
  } catch (error) {
    console.error(`Failed to update notification ${id}:`, error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to update notification" }
  }
}

export async function updateExistingNotification(
  id: string, 
  data: { read?: boolean; [key: string]: any }
) {
  try {
    const notification = await prisma.notification.update({
      where: { id },
      data,
    })
    
    revalidatePath("/admin/notifications")
    return { success: true, data: notification }
  } catch (error) {
    console.error(`Failed to update notification ${id}:`, error)
    return { success: false, error: "Failed to update notification" }
  }
}

export async function deleteNotification(id: string) {
  try {
    await prisma.notification.delete({
      where: { id },
    })
    
    revalidatePath("/admin/notifications")
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete notification ${id}:`, error)
    return { success: false, error: "Failed to delete notification" }
  }
}

export async function deleteExistingNotification(id: string) {
  return deleteNotification(id)
}

export async function getActiveNotifications() {
  try {
    const now = new Date()
    
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    
    return { success: true, data: notifications }
  } catch (error) {
    console.error("Failed to fetch active notifications:", error)
    return { success: false, error: "Failed to fetch active notifications" }
  }
}