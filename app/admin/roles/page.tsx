// app/admin/roles/page.tsx - Updated for simplified schema
import React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { RolesTable } from "@/components/admin/roles-table"
import { getRoles } from "@/lib/actions/role-actions"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  SYSTEM_PERMISSIONS, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Shield, Users, Key } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Role Management",
  description: "Create and manage custom roles with specific permissions",
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

export default async function RolesPage() {
  try {
    // Check authentication
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to manage roles
    const roleManagementCheck = checkPermission(currentUser, SYSTEM_PERMISSIONS.ROLE_MANAGEMENT)
    
    if (!roleManagementCheck.allowed) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold">Role Management</h3>
              <p className="text-muted-foreground">
                Create and manage custom roles with specific permissions
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'SYSTEM.ROLE_MANAGEMENT' permission to manage roles.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

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
    const systemRoles = roles.filter(role => role.isSystemRole || role.isSystem).length
    const customRoles = roles.filter(role => !(role.isSystemRole || role.isSystem)).length
    const totalUsers = roles.reduce((sum, role) => sum + (role.userCount || 0), 0)

    // Calculate permission stats
    const totalPermissions = roles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0)
    const avgPermissionsPerRole = totalRoles > 0 ? Math.round(totalPermissions / totalRoles) : 0

    // User has permission - show the actual component
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                Built-in system roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Avg Permissions</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPermissionsPerRole}</div>
              <p className="text-xs text-muted-foreground">
                Per role average
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
          <Button asChild disabled>
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
