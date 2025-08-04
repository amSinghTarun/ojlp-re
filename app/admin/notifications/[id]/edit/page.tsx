// app/admin/notifications/[id]/edit/page.tsx
import React from "react"
import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { NotificationForm } from "@/components/admin/notification-form"
import { getNotificationById } from "@/lib/actions/notification-actions"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft, Pencil, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

interface EditNotificationPageProps {
  params: {
    id: string
  }
}

// Get current user with permissions
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

export async function generateMetadata({ params }: EditNotificationPageProps): Promise<Metadata> {
  try {
    const result = await getNotificationById(params.id)
    const notification = result.success ? result.data : null
    
    return {
      title: notification ? `Edit Notification: ${notification.title}` : "Edit Notification",
      description: notification ? `Edit notification: ${notification.title}` : "Edit notification",
    }
  } catch {
    return {
      title: "Edit Notification",
      description: "Edit notification",
    }
  }
}

export default async function EditNotificationPage({ params }: EditNotificationPageProps) {
  try {
    // Validate params
    if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
      console.error("Invalid notification ID:", params.id)
      notFound()
    }

    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to edit notifications
    const permissionCheck = checkPermission(currentUser, 'notification.UPDATE')
    
    if (!permissionCheck.allowed) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/notifications">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notifications
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to edit notifications
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to edit notifications. Contact your administrator for access."}
            </AlertDescription>
          </Alert>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Pencil className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Editing Notifications</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    To edit notifications, you need:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <code className="bg-blue-100 px-1 rounded">notification.UPDATE</code> permission</li>
                    <li>• Access to manage notification content</li>
                    <li>• Authority to modify user communications</li>
                  </ul>
                  <p className="text-sm text-blue-800 mt-3">
                    Contact your system administrator to request these permissions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Get notification data
    const result = await getNotificationById(params.id)

    // Handle errors
    if (!result.success) {
      if (result.error?.includes("not found") || result.error?.includes("Notification not found")) {
        notFound()
      }
      throw new Error(result.error || "Failed to load notification")
    }

    const notification = result.data!

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/notifications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notifications
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Notification: {notification.title}</h1>
            <p className="text-muted-foreground">
              Update notification content, priority, and settings
            </p>
          </div>
        </div>

        {/* Edit Guidelines */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Editing Guidelines</h4>
                <p className="text-sm text-blue-800 mb-3">
                  When updating notification information:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure all changes maintain message clarity and accuracy</li>
                  <li>• Test hyperlinks using <code className="bg-blue-100 px-1 rounded">hyperLink:[text](URL)</code> format</li>
                  <li>• Update priority if urgency has changed</li>
                  <li>• Adjust expiration dates for time-sensitive content</li>
                  <li>• Preview content to verify hyperlinks render correctly</li>
                  <li>• Consider the impact of changes on user experience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <NotificationForm notification={notification} />
      </div>
    )
  } catch (error) {
    console.error("Error loading edit notification page:", error)
    
    // Check if it's a not found error
    if (error instanceof Error && (error.message.includes("not found") || error.message.includes("Notification not found"))) {
      notFound()
    }
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/notifications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notifications
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error Loading Notification</h1>
            <p className="text-muted-foreground">
              There was a problem loading the notification data
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the notification edit form"}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer">Error Details (Development)</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">
                  {error instanceof Error ? error.stack || error.message : String(error)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/admin/notifications">
              Back to Notifications
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/notifications/new">
              Create New Notification
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}