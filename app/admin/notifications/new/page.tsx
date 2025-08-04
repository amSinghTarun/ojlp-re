// app/admin/notifications/new/page.tsx
import React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { NotificationForm } from "@/components/admin/notification-form"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft, PlusCircle, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Create Notification",
  description: "Create a new notification for users",
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

export default async function NewNotificationPage() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to create notifications
    const permissionCheck = checkPermission(currentUser, 'notification.CREATE')
    
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
                You don't have permission to create notifications
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to create notifications. Contact your administrator for access."}
            </AlertDescription>
          </Alert>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <PlusCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Creating Notifications</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    To create new notifications, you need:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <code className="bg-blue-100 px-1 rounded">notification.CREATE</code> permission</li>
                    <li>• Access to manage user communications</li>
                    <li>• Authority to publish announcements</li>
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
            <h1 className="text-2xl font-bold">Create Notification</h1>
            <p className="text-muted-foreground">
              Create a new notification with hyperlinks, priority settings, and expiration dates
            </p>
          </div>
        </div>

        {/* Guidelines Card */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Notification Guidelines</h4>
                <p className="text-sm text-green-800 mb-3">
                  Create effective notifications with these best practices:
                </p>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Use clear, concise titles that grab attention</li>
                  <li>• Include hyperlinks using <code className="bg-green-100 px-1 rounded">hyperLink:[text](URL)</code> syntax</li>
                  <li>• Set appropriate priority levels based on urgency</li>
                  <li>• Add expiration dates for time-sensitive content</li>
                  <li>• Choose the right notification type for better organization</li>
                  <li>• Preview your content to ensure hyperlinks work correctly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <NotificationForm />
      </div>
    )
  } catch (error) {
    console.error("Error loading new notification page:", error)
    
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
            <h1 className="text-2xl font-bold">Error Loading Page</h1>
            <p className="text-muted-foreground">
              Failed to load the notification creation form
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the notification creation form"}
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
        </div>
      </div>
    )
  }
}