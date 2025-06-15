"use server"

import { revalidatePath } from "next/cache"
import {
  getNotifications,
  getActiveNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
} from "../controllers/notifications"
import { z } from "zod"

const notificationSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  type: z.string().min(1, "Type is required"),
  priority: z.enum(["low", "medium", "high"]).optional(),
  link: z.string().optional(),
  image: z.string().optional(),
  expiresAt: z.date().optional().nullable(),
})

export async function getAllNotifications() {
  try {
    const notifications = await getNotifications()
    return { success: true, data: notifications }
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return { success: false, error: "Failed to fetch notifications" }
  }
}

export async function getActiveNotificationsList() {
  try {
    const notifications = await getActiveNotifications()
    return { success: true, data: notifications }
  } catch (error) {
    console.error("Failed to fetch active notifications:", error)
    return { success: false, error: "Failed to fetch active notifications" }
  }
}

export async function getNotificationDetail(id: string) {
  try {
    const notification = await getNotificationById(id)
    if (!notification) {
      return { success: false, error: "Notification not found" }
    }
    return { success: true, data: notification }
  } catch (error) {
    console.error(`Failed to fetch notification ${id}:`, error)
    return { success: false, error: "Failed to fetch notification" }
  }
}

export async function createNewNotification(data: z.infer<typeof notificationSchema>) {
  try {
    const validatedData = notificationSchema.parse(data)
    const notification = await createNotification(validatedData)
    revalidatePath("/admin/notifications")
    revalidatePath("/notifications")
    return { success: true, data: notification }
  } catch (error) {
    console.error("Failed to create notification:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to create notification" }
  }
}

export async function updateExistingNotification(id: string, data: Partial<z.infer<typeof notificationSchema>>) {
  try {
    const notification = await updateNotification(id, data)
    revalidatePath("/admin/notifications")
    revalidatePath("/notifications")
    return { success: true, data: notification }
  } catch (error) {
    console.error(`Failed to update notification ${id}:`, error)
    return { success: false, error: "Failed to update notification" }
  }
}

export async function deleteExistingNotification(id: string) {
  try {
    await deleteNotification(id)
    revalidatePath("/admin/notifications")
    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete notification ${id}:`, error)
    return { success: false, error: "Failed to delete notification" }
  }
}
