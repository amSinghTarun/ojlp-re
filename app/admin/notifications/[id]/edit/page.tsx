

// app/admin/notifications/[id]/edit/page.tsx - WITH SIMPLE PERMISSION CHECKS
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { NotificationForm } from "@/components/admin/notification-form"
import { getNotificationById } from "@/lib/actions/notification-actions"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface EditNotificationPageProps {
  params: {
    id: string
  }
}

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

export default async function EditNotificationPage({ params }: EditNotificationPageProps) {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Check if user has permission to update notifications
  const notificationUpdateCheck = checkPermission(currentUser, 'notification.UPDATE')
  
  if (!notificationUpdateCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader heading="Edit Notification" text="Edit notification details." />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'notification.UPDATE' permission to edit notifications.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Fetch notification data from database
  const result = await getNotificationById(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const notification = result.data

  // User has permission - show the actual component
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