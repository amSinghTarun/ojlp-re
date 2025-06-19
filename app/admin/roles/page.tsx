import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"
import { RolesTable } from "@/components/admin/roles-table"
import { getRoles } from "@/lib/actions/role-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Shield, Users, Key } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Role Management",
  description: "Create and manage custom roles with specific permissions",
}

export default async function RolesPage() {
  const currentUser = await getCurrentUser()

  // Only super admins can access this page
  if (!currentUser || !isSuperAdmin(currentUser)) {
    redirect("/admin")
  }

  try {
    // Fetch roles from database
    const { roles, error } = await getRoles()

    if (error) {
      throw new Error(error)
    }

    if (!roles) {
      throw new Error("No roles data received")
    }

    // Calculate stats
    const totalRoles = roles.length
    const systemRoles = roles.filter(role => role.isSystemRole).length
    const customRoles = roles.filter(role => !role.isSystemRole).length
    const totalUsers = roles.reduce((sum, role) => sum + role.userCount, 0)

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Role Management</h3>
            <p className="text-muted-foreground">
              Create and manage custom roles with specific permissions
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/roles/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Role
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRoles}</div>
              <p className="text-xs text-muted-foreground">
                Active roles in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemRoles}</div>
              <p className="text-xs text-muted-foreground">
                Built-in protected roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customRoles}</div>
              <p className="text-xs text-muted-foreground">
                User-created roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Users with roles assigned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Roles Table */}
        <RolesTable initialRoles={roles} />
      </div>
    )
  } catch (error) {
    console.error("Error loading roles page:", error)
    
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Role Management</h3>
            <p className="text-muted-foreground">
              Create and manage custom roles with specific permissions
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/roles/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Role
            </Link>
          </Button>
        </div>

        {/* Error Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load roles. Please check your database connection and try again.
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