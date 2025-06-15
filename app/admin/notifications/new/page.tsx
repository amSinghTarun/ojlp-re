import { DashboardHeader } from "@/components/admin/dashboard-header"
import { NotificationForm } from "@/components/admin/notification-form"

export default function NewNotificationPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader heading="Create New Notification" text="Create a new notification for users." />
      <NotificationForm />
    </div>
  )
}
