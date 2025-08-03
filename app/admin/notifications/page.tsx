// app/admin/notifications/page.tsx
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { NotificationsTable } from "@/components/admin/notifications-table"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, PlusCircle, Eye, ArrowLeft, Bell, BarChart3, Clock, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNotificationStats } from "@/lib/controllers/notifications"
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
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to view notifications
    const permissionCheck = checkPermission(currentUser, 'notification.READ')
    console.log("PERMISSION CHECK", permissionCheck)
    if (!permissionCheck.allowed) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to view notifications
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to view notifications. Contact your administrator for access."}
            </AlertDescription>
          </Alert>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Required Permissions</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Notification management requires the following permissions:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <code className="bg-blue-100 px-1 rounded">notification.READ</code> - View notifications</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">notification.CREATE</code> - Create new notifications</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">notification.UPDATE</code> - Edit notifications</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">notification.DELETE</code> - Delete notifications</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">notification.ALL</code> - Full notification management</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Get stats for the dashboard
    let stats = null
    try {
      stats = await getNotificationStats()
    } catch (error) {
      console.error("Failed to load notification stats:", error)
      // Continue without stats - they're not critical
    }

    // Check additional permissions for different actions
    const canCreateNotifications = checkPermission(currentUser, 'notification.CREATE').allowed
    const canUpdateNotifications = checkPermission(currentUser, 'notification.UPDATE').allowed
    const canDeleteNotifications = checkPermission(currentUser, 'notification.DELETE').allowed

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader 
            heading="Notifications" 
            text="Create and manage notifications for users. Use hyperlinks to make notifications interactive." 
          />
          {canCreateNotifications && (
            <Button asChild>
              <Link href="/admin/notifications/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Notification
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All notifications</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Currently visible</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.byPriority.high}</div>
                <p className="text-xs text-muted-foreground">Urgent notifications</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{stats.expired}</div>
                <p className="text-xs text-muted-foreground">Past expiration date</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Call for Papers</CardTitle>
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.byType.call_for_papers || 0}</div>
                <p className="text-xs text-muted-foreground">Academic notifications</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Info */}
        {canCreateNotifications && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Notification Features</h4>
                  <p className="text-sm text-green-800 mb-3">
                    Create engaging notifications with these features:
                  </p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>Hyperlinks:</strong> Use <code className="bg-green-100 px-1 rounded">hyperLink:[text](URL)</code> syntax for clickable links</li>
                    <li>• <strong>Priority Levels:</strong> Set high, medium, or low priority for proper display ordering</li>
                    <li>• <strong>Expiration Dates:</strong> Set automatic expiration to keep content current</li>
                    <li>• <strong>Action Buttons:</strong> Add main action buttons with custom text and URLs</li>
                    <li>• <strong>Type Categories:</strong> Organize by call for papers, events, announcements, etc.</li>
                    <li>• <strong>Rich Content:</strong> Include detailed descriptions with proper formatting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Table */}
        <NotificationsTable />

        {/* Permission Notice for Read-Only Users */}
        {!canUpdateNotifications && !canCreateNotifications && !canDeleteNotifications && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  You have read-only access to notifications. Contact an administrator for management permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Card */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Notification System</h4>
                <p className="text-sm text-gray-600">
                  Manage user notifications with priority levels, expiration dates, and interactive hyperlinks for better engagement.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/notifications" target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    Public View
                  </Link>
                </Button>
                {canCreateNotifications && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/notifications/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Notification
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error loading notifications page:", error)
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error Loading Page</h1>
            <p className="text-muted-foreground">
              There was a problem loading the notifications page
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the notifications page"}
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