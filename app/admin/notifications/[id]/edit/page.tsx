import { DashboardHeader } from "@/components/admin/dashboard-header"
import { NotificationForm } from "@/components/admin/notification-form"
import { notifications } from "@/lib/notifications"
import { notFound } from "next/navigation"

interface EditNotificationPageProps {
  params: {
    id: string
  }
}

export default function EditNotificationPage({ params }: EditNotificationPageProps) {
  // In a real application, you would fetch this data from your database
  const notification = notifications.find((notification) => notification.id === params.id)

  if (!notification) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <DashboardHeader heading={`Edit Notification: ${notification.title}`} text="Edit notification details." />
      <NotificationForm notification={notification} />
    </div>
  )
}
