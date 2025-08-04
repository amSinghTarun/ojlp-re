// app/admin/roles/[id]/edit/page.tsx - Updated for simplified schema
import React from "react"
import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { RoleForm } from "@/components/admin/role-form"
import { getRole, getPermissions } from "@/lib/actions/role-actions"
import { checkPermission } from "@/lib/permissions/checker"
import { PermissionOption, UserWithPermissions } from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export const dynamic = 'force-dynamic'

interface EditRolePageProps {
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

export async function generateMetadata({ params }: EditRolePageProps): Promise<Metadata> {
  try {
    const { role } = await getRole(params.id)
    
    return {
      title: role ? `Edit Role: ${role.name}` : "Edit Role",
      description: role ? `Edit role permissions and settings for ${role.name}` : "Edit role permissions and settings",
    }
  } catch {
    return {
      title: "Edit Role",
      description: "Edit role permissions and settings",
    }
  }
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  try {
    // Validate params
    if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
      console.error("Invalid role ID:", params.id)
      notFound()
    }

    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to manage roles
    const permissionCheck = checkPermission(currentUser, 'SYSTEM.ROLE_MANAGEMENT')
    if (!permissionCheck.allowed) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/roles">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roles
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to edit roles
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to edit roles. Contact your administrator for access.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Get role and permissions data
    const [roleResult, permissionsResult] = await Promise.all([
      getRole(params.id),
      getPermissions()
    ])

    const { role, error: roleError } = roleResult
    const { permissions, error: permissionsError } = permissionsResult

    // Handle errors
    if (roleError || !role) {
      if (roleError === "Role not found" || roleError?.includes("not found")) {
        notFound()
      }
      throw new Error(roleError || "Failed to load role")
    }

    if (permissionsError || !permissions) {
      throw new Error(permissionsError || "Failed to load permissions")
    }

    return (
      <RoleForm
        role={role as Role & { userCount: number; users?: Array<{ id: string; name: string; email: string }> }}
        availablePermissions={permissions as Record<string, PermissionOption[]>}
        mode="edit"
      />
    )
  } catch (error) {
    console.error("Error loading edit role page:", error)
    
    // Check if it's a not found error
    if (error instanceof Error && error.message.includes("not found")) {
      notFound()
    }
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/roles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Roles
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error Loading Role</h1>
            <p className="text-muted-foreground">
              There was a problem loading the role data
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the role edit form"}
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
        
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/admin/roles">
              Back to Roles
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}