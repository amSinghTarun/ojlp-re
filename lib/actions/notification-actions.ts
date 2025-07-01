"use server"

import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { NotificationType } from "@prisma/client"

// Helper function to get current user with permissions
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

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
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    if (!notificationId || typeof notificationId !== 'string') {
      return { success: false, error: "Invalid notification ID provided" }
    }

    // Get the existing notification to check ownership if needed
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!existingNotification) {
      return { success: false, error: "Notification not found" }
    }

    // Check if user has permission to update notifications
    const permissionCheck = checkPermission(currentUser, 'notification.UPDATE', {
      resourceId: existingNotification.id
    })

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to update this notification" 
      }
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    console.log(`✅ User ${currentUser.email} updated notification: ${updatedNotification.title}`)

    revalidatePath("/admin/notifications")
    revalidatePath("/notifications")

    return { success: true, data: updatedNotification }
  } catch (error) {
    console.error("Failed to update notification:", error)
    return { success: false, error: "Failed to update notification" }
  }
}

export async function deleteExistingNotification(notificationId: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    if (!notificationId || typeof notificationId !== 'string') {
      return { success: false, error: "Invalid notification ID provided" }
    }

    // Get the existing notification to check ownership if needed
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!existingNotification) {
      return { success: false, error: "Notification not found" }
    }

    // Check if user has permission to delete notifications
    const permissionCheck = checkPermission(currentUser, 'notification.DELETE', {
      resourceId: existingNotification.id
    })

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to delete this notification" 
      }
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    })

    console.log(`✅ User ${currentUser.email} deleted notification: ${existingNotification.title}`)

    revalidatePath("/admin/notifications")
    revalidatePath("/notifications")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete notification:", error)
    return { success: false, error: "Failed to delete notification" }
  }
}

export async function getHighPriorityNotifications() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return []
    }

    // Check if user has permission to read notifications
    const permissionCheck = checkPermission(currentUser, 'notification.READ')
    if (!permissionCheck.allowed) {
      console.warn(`User ${currentUser.email} attempted to read high priority notifications without permission`)
      return []
    }

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

    console.log(`✅ User ${currentUser.email} fetched ${notifications.length} high priority notifications`)

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
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read notifications
    const permissionCheck = checkPermission(currentUser, 'notification.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to view notifications" 
      }
    }

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

    console.log(`✅ User ${currentUser.email} fetched ${notifications.length} notifications`)

    // Transform the data to match the expected format
    return { 
      success: true, 
      data: notifications.map(notification => ({
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
    }
  } catch (error) {
    console.error("Failed to fetch all notifications:", error)
    return { success: false, error: "Failed to fetch notifications" }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    if (!notificationId || typeof notificationId !== 'string') {
      return { success: false, error: "Invalid notification ID provided" }
    }

    // Get the existing notification
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!existingNotification) {
      return { success: false, error: "Notification not found" }
    }

    // Check if user has permission to update notifications (marking as read is an update)
    const permissionCheck = checkPermission(currentUser, 'notification.UPDATE', {
      resourceId: existingNotification.id
    })

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to mark this notification as read" 
      }
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })

    console.log(`✅ User ${currentUser.email} marked notification as read: ${existingNotification.title}`)

    revalidatePath("/admin/notifications")
    revalidatePath("/notifications")

    return { success: true }
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

export async function getNotificationById(id: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid notification ID provided" }
    }

    // Check if user has permission to read notifications
    const permissionCheck = checkPermission(currentUser, 'notification.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to view notification details" 
      }
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return { success: false, error: "Notification not found" }
    }

    console.log(`✅ User ${currentUser.email} viewed notification: ${notification.title}`)

    return { success: true, data: notification }
  } catch (error) {
    console.error("Failed to fetch notification:", error)
    return { success: false, error: "Failed to fetch notification" }
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
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create notifications
    const permissionCheck = checkPermission(currentUser, 'notification.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to create notifications" 
      }
    }

    // Validate required fields
    if (!data.title || !data.content || !data.type) {
      return { success: false, error: "Title, content, and type are required" }
    }

    // Validate notification type
    const validTypes = Object.values(NotificationType)
    if (!validTypes.includes(data.type as NotificationType)) {
      return { success: false, error: "Invalid notification type provided" }
    }

    const notification = await prisma.notification.create({
      data: {
        ...data,
        date: new Date(),
        priority: data.priority || "medium",
        type: data.type as NotificationType,
      },
    })

    console.log(`✅ User ${currentUser.email} created notification: ${notification.title}`)

    revalidatePath("/admin/notifications")
    revalidatePath("/notifications")

    return { success: true, data: notification }
  } catch (error) {
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
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid notification ID provided" }
    }

    // Get the existing notification
    const existingNotification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!existingNotification) {
      return { success: false, error: "Notification not found" }
    }

    // Check if user has permission to update notifications
    const permissionCheck = checkPermission(currentUser, 'notification.UPDATE', {
      resourceId: existingNotification.id
    })

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to update this notification" 
      }
    }

    // Validate notification type if provided
    if (data.type) {
      const validTypes = Object.values(NotificationType)
      if (!validTypes.includes(data.type)) {
        return { success: false, error: "Invalid notification type provided" }
      }
    }

    const notification = await prisma.notification.update({
      where: { id },
      data,
    })

    console.log(`✅ User ${currentUser.email} updated notification: ${notification.title}`)

    revalidatePath("/admin/notifications")
    revalidatePath("/notifications")

    return { success: true, data: notification }
  } catch (error) {
    console.error("Failed to update notification:", error)
    return { success: false, error: "Failed to update notification" }
  }
}

// NEW: Function to get notifications with permission context
export async function getNotificationsWithPermissions() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read notifications
    const permissionCheck = checkPermission(currentUser, 'notification.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: "You don't have permission to view notifications" 
      }
    }

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

    // Add permission context to each notification
    const notificationsWithPermissions = notifications.map(notification => ({
      ...notification,
      canEdit: checkPermission(currentUser, 'notification.UPDATE', {
        resourceId: notification.id
      }).allowed,
      canDelete: checkPermission(currentUser, 'notification.DELETE', {
        resourceId: notification.id
      }).allowed,
    }))

    return { 
      success: true, 
      data: notificationsWithPermissions,
      canCreate: checkPermission(currentUser, 'notification.CREATE').allowed
    }
  } catch (error) {
    console.error("Failed to fetch notifications with permissions:", error)
    return { success: false, error: "Failed to fetch notifications" }
  }
}

// NEW: Function to check notification permissions
export async function checkNotificationPermissions(notificationId?: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { 
        success: false, 
        error: "Authentication required",
        permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
      }
    }

    let permissions = {
      canRead: checkPermission(currentUser, 'notification.READ').allowed,
      canCreate: checkPermission(currentUser, 'notification.CREATE').allowed,
      canUpdate: false,
      canDelete: false,
    }

    // If specific notification ID is provided, check update/delete permissions
    if (notificationId) {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      })

      if (notification) {
        permissions.canUpdate = checkPermission(currentUser, 'notification.UPDATE', {
          resourceId: notification.id
        }).allowed

        permissions.canDelete = checkPermission(currentUser, 'notification.DELETE', {
          resourceId: notification.id
        }).allowed
      }
    }

    return { success: true, permissions }
  } catch (error) {
    console.error("Failed to check notification permissions:", error)
    return { 
      success: false, 
      error: "Failed to check permissions",
      permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
    }
  }
}

// NEW: Function to get notification types that user can create
export async function getAvailableNotificationTypes() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create notifications
    const permissionCheck = checkPermission(currentUser, 'notification.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: "You don't have permission to create notifications" 
      }
    }

    // Return all available notification types
    const notificationTypes = Object.values(NotificationType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))

    return { success: true, data: notificationTypes }
  } catch (error) {
    console.error("Failed to get available notification types:", error)
    return { success: false, error: "Failed to get available notification types" }
  }
}