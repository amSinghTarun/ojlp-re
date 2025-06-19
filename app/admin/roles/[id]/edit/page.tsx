import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"
import { RoleForm } from "@/components/admin/role-form"
import { getRole, getPermissions } from "@/lib/actions/role-actions"

interface EditRolePageProps {
  params: {
    id: string
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
  const currentUser = await getCurrentUser()

  // Only super admins can edit roles
  if (!currentUser || !isSuperAdmin(currentUser)) {
    redirect("/admin")
  }

  try {
    // Get role and permissions data
    const [roleResult, permissionsResult] = await Promise.all([
      getRole(params.id),
      getPermissions()
    ])

    const { role, error: roleError } = roleResult
    const { permissions, error: permissionsError } = permissionsResult

    // Handle errors
    if (roleError || !role) {
      if (roleError === "Role not found") {
        notFound()
      }
      throw new Error(roleError || "Failed to load role")
    }

    if (permissionsError || !permissions) {
      throw new Error(permissionsError || "Failed to load permissions")
    }

    return (
      <RoleForm
        role={role}
        availablePermissions={permissions}
        mode="edit"
      />
    )
  } catch (error) {
    console.error("Error loading edit role page:", error)
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error Loading Role</h1>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Failed to load the role edit form"}
          </p>
          <a 
            href="/admin/roles" 
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Roles
          </a>
        </div>
      </div>
    )
  }
}
