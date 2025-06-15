import { DashboardHeader } from "@/components/admin/dashboard-header"
import { NotificationsTable } from "@/components/admin/notifications-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Notifications" text="Create and manage notifications for users." />
        <Button asChild>
          <Link href="/admin/notifications/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Notification
          </Link>
        </Button>
      </div>
      <NotificationsTable />
    </div>
  )
}
