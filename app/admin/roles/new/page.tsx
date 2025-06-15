import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"
import { RoleForm } from "@/components/admin/role-form"

export const metadata: Metadata = {
  title: "Create Role",
  description: "Create a new custom role",
}

export default async function CreateRolePage() {
  const user = await getCurrentUser()

  // Only super admins can access this page
  if (!user || !isSuperAdmin(user)) {
    redirect("/admin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Role</h3>
        <p className="text-sm text-muted-foreground">Create a new custom role with specific permissions</p>
      </div>

      <RoleForm />
    </div>
  )
}
