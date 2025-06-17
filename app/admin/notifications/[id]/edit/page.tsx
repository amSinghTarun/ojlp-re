import { DashboardHeader } from "@/components/admin/dashboard-header"
import { NotificationForm } from "@/components/admin/notification-form"
import { getNotificationById } from "@/lib/actions/notification-actions"
import { notFound } from "next/navigation"

interface EditNotificationPageProps {
  params: {
    id: string
  }
}

export default async function EditNotificationPage({ params }: EditNotificationPageProps) {
  // Fetch notification data from database
  const result = await getNotificationById(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const notification = result.data

  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading={`Edit Notification: ${notification.title}`} 
        text="Edit notification details." 
      />
      <NotificationForm notification={notification} />
    </div>
  )
}