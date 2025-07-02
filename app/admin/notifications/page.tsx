// app/admin/notifications/page.tsx - WITH SIMPLE PERMISSION CHECKS
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { NotificationsTable } from "@/components/admin/notifications-table"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, PlusCircle } from "lucide-react"
import Link from "next/link"

// Get current user with permissions helper
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

export default async function NotificationsPage() {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Check if user has permission to view notifications
  const notificationReadCheck = checkPermission(currentUser, 'notification.READ')
  
  if (!notificationReadCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader heading="Notifications" text="Create and manage notifications for users." />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'notification.READ' permission to view notifications.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if user can create notifications (for showing/hiding the New Notification button)
  const canCreateNotifications = checkPermission(currentUser, 'notification.CREATE').allowed

  // User has permission - show the actual component
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Notifications" text="Create and manage notifications for users." />
        {canCreateNotifications && (
          <Button asChild>
            <Link href="/admin/notifications/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Notification
            </Link>
          </Button>
        )}
      </div>
      
      {/* Permission Info Alert */}
      {!canCreateNotifications && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to notifications. Contact your administrator to request creation permissions.
          </AlertDescription>
        </Alert>
      )}
      
      <NotificationsTable />
    </div>
  )
}
