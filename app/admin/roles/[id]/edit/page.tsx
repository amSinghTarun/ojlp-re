import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"
import { RoleForm } from "@/components/admin/role-form"
import { getRole } from "@/lib/actions/role-actions"

export const metadata: Metadata = {
  title: "Edit Role",
  description: "Edit an existing role",
}

export default async function EditRolePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  // Only super admins can access this page
  if (!user || !isSuperAdmin(user)) {
    redirect("/admin")
  }

  const { role, error } = await getRole(params.id)

  if (error || !role) {
    redirect("/admin/roles")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Edit Role: {role.name}</h3>
        <p className="text-sm text-muted-foreground">Update role details and permissions</p>
      </div>

      <RoleForm role={role} />
    </div>
  )
}
