import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"
import { PermissionsTable } from "@/components/admin/permission-table"
import { getPermissions, initializeSystemPermissions } from "@/lib/actions/permission-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Key, Shield, Users, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Permission Management",
  description: "Manage system permissions and their assignments",
}

export default async function PermissionsPage() {
  const currentUser = await getCurrentUser()

  // Only super admins can access this page
  if (!currentUser || !isSuperAdmin(currentUser)) {
    redirect("/admin")
  }

  try {
    // Fetch permissions from database
    const { permissions, error } = await getPermissions()

    if (error) {
      throw new Error(error)
    }

    if (!permissions) {
      throw new Error("No permissions data received")
    }

    // Calculate stats
    const totalPermissions = permissions.length
    const assignedPermissions = permissions.filter(p => p.totalAssignments > 0).length
    const unassignedPermissions = permissions.filter(p => p.totalAssignments === 0).length
    const totalAssignments = permissions.reduce((sum, p) => sum + p.totalAssignments, 0)

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Permission Management</h3>
            <p className="text-muted-foreground">
              Manage system permissions and their assignments to roles and users
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/permissions/initialize">
                <Settings className="mr-2 h-4 w-4" />
                Initialize System
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/permissions/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Permission
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPermissions}</div>
              <p className="text-xs text-muted-foreground">
                Available permissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedPermissions}</div>
              <p className="text-xs text-muted-foreground">
                Permissions in use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unassignedPermissions}</div>
              <p className="text-xs text-muted-foreground">
                Unused permissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssignments}</div>
              <p className="text-xs text-muted-foreground">
                Role + user assignments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        {unassignedPermissions > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {unassignedPermissions} permission(s) that are not assigned to any roles or users. 
              Consider assigning them or removing them if they're no longer needed.
            </AlertDescription>
          </Alert>
        )}

        {/* Permissions Table */}
        <PermissionsTable initialPermissions={permissions} />
      </div>
    )
  } catch (error) {
    console.error("Error loading permissions page:", error)
    
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Permission Management</h3>
            <p className="text-muted-foreground">
              Manage system permissions and their assignments
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/permissions/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Permission
            </Link>
          </Button>
        </div>

        {/* Error Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load permissions. Please check your database connection and try again.
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer">Error Details (Development)</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}
