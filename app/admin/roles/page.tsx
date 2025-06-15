import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"
import { RolesTable } from "@/components/admin/roles-table"
import { getRoles } from "@/lib/actions/role-actions"
import { PlusCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Role Management",
  description: "Create and manage custom roles",
}

export default async function RolesPage() {
  const user = await getCurrentUser()

  // Only super admins can access this page
  if (!user || !isSuperAdmin(user)) {
    redirect("/admin")
  }

  const { roles, error } = await getRoles()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Role Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage custom roles with specific permissions</p>
        </div>
        <Button asChild>
          <Link href="/admin/roles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Role
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">{error}</div>
      ) : (
        <RolesTable roles={roles || []} />
      )}
    </div>
  )
}
