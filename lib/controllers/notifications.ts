import prisma from "../prisma"

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
      priority: data.priority || "medium",
    },
  })
}

export async function updateNotification(
  id: string,
  data: {
    title?: string
    content?: string
    type?: string
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
  return prisma.notificationRead.create({
    data: {
      notificationId: id,
      userId,
    },
  })
}

export async function getUnreadNotificationsForUser(userId: string) {
  const now = new Date()

  // Get all active notifications
  const allNotifications = await prisma.notification.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  })

  // Get all notifications that the user has read
  const readNotifications = await prisma.notificationRead.findMany({
    where: {
      userId,
    },
    select: {
      notificationId: true,
    },
  })

  const readNotificationIds = new Set(readNotifications.map((n) => n.notificationId))

  // Filter out the read notifications
  return allNotifications.filter((notification) => !readNotificationIds.has(notification.id))
}
