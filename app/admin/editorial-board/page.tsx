// app/admin/editorial-board/page.tsx - Updated with better permissions and error handling
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { EditorialBoardTable } from "@/components/admin/editorial-board-table"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, PlusCircle, Eye, ArrowLeft, Users, UserCheck, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEditorialBoardStats } from "@/lib/controllers/editorial-board"
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

export default async function EditorialBoardPage() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to view editorial board
    const permissionCheck = checkPermission(currentUser, 'editorialboard.READ')
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
                You don't have permission to view the editorial board
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to view editorial board members. Contact your administrator for access."}
            </AlertDescription>
          </Alert>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Required Permissions</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Editorial board management requires the following permissions:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <code className="bg-blue-100 px-1 rounded">editorialboard.READ</code> - View board members</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">editorialboard.CREATE</code> - Add new members</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">editorialboard.UPDATE</code> - Edit member details</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">editorialboard.DELETE</code> - Remove members</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">editorialboard.ALL</code> - Full board management</li>
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
      stats = await getEditorialBoardStats()
    } catch (error) {
      console.error("Failed to load editorial board stats:", error)
      // Continue without stats - they're not critical
    }

    // Check additional permissions for different actions
    const canCreateMembers = checkPermission(currentUser, 'editorialboard.CREATE').allowed
    const canUpdateMembers = checkPermission(currentUser, 'editorialboard.UPDATE').allowed
    const canDeleteMembers = checkPermission(currentUser, 'editorialboard.DELETE').allowed

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader heading="Editorial Board" text="Manage the editorial board members and their roles." />
          {canCreateMembers && (
            <Button asChild>
              <Link href="/admin/editorial-board/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Member
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Active board members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Editors</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.editors}</div>
                <p className="text-xs text-muted-foreground">Editorial team members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Advisors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.advisors}</div>
                <p className="text-xs text-muted-foreground">Advisory board members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archived</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.archived}</div>
                <p className="text-xs text-muted-foreground">Previously active members</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Permission Status Indicator */}
        {/* <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-muted-foreground">
                You have permission to view editorial board members
                {canCreateMembers && " and add new members"}
                {canUpdateMembers && " and edit existing members"}
                {canDeleteMembers && " and remove members"}
              </p>
            </div>
            <div className="flex gap-2">
              {canCreateMembers && (
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Can Create
                </span>
              )}
              {canUpdateMembers && (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  Can Edit
                </span>
              )}
              {canDeleteMembers && (
                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                  Can Delete
                </span>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/editorial-board" target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View Public
                </Link>
              </Button>
            </div>
          </div>
        </div> */}

        {/* Management Guidelines */}
        {/* {(canCreateMembers || canUpdateMembers) && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Editorial Board Management</h4>
                  <p className="text-sm text-green-800 mb-3">
                    When managing editorial board members, please ensure:
                  </p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Member information is accurate and up-to-date</li>
                    <li>• Professional photos are used for member profiles</li>
                    <li>• Designations and current affiliations are correct</li>
                    <li>• Display order reflects hierarchy and importance</li>
                    <li>• Contact information and social links are verified</li>
                    <li>• Areas of expertise are clearly defined</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Editorial Board Table with Permission Context */}
        <EditorialBoardTable />

        {/* Permission Notice for Read-Only Users */}
        {!canUpdateMembers && !canCreateMembers && !canDeleteMembers && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  You have read-only access to editorial board members. Contact an administrator for management permissions.
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
                <h4 className="font-semibold text-gray-900 mb-1">Editorial Board Structure</h4>
                <p className="text-sm text-gray-600">
                  The editorial board consists of Editors and Advisory Board members with different roles and responsibilities.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/editorial-board" target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    Public View
                  </Link>
                </Button>
                {canCreateMembers && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/editorial-board/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Member
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
    console.error("Error loading editorial board page:", error)
    
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
              There was a problem loading the editorial board page
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the editorial board page"}
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
            <Link href="/admin/editorial-board">
              Back to Editorial Board
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}