import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"
import { RoleForm } from "@/components/admin/role-form"
import { getPermissions } from "@/lib/actions/role-actions"

export const metadata: Metadata = {
  title: "Create New Role",
  description: "Create a new role with specific permissions",
}

export default async function NewRolePage() {
  const currentUser = await getCurrentUser()

  // Only super admins can create roles
  if (!currentUser || !isSuperAdmin(currentUser)) {
    redirect("/admin")
  }

  try {
    // Get available permissions
    const { permissions, error } = await getPermissions()

    if (error || !permissions) {
      throw new Error(error || "Failed to load permissions")
    }

    return (
      <RoleForm
        availablePermissions={permissions}
        mode="create"
      />
    )
  } catch (error) {
    console.error("Error loading new role page:", error)
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error Loading Page</h1>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Failed to load the role creation form"}
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