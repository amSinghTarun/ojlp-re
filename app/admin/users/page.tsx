import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { UsersTable } from "@/components/admin/users-table"
import { getUsers } from "@/lib/controllers/users"

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users who can access the admin panel",
}

export default async function UsersPage() {
  const user = await getCurrentUser()

  // Only users with MANAGE_USERS permission can access this page
  if (!user || !hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
    redirect("/admin")
  }

  // Fetch users directly from the database using the controller
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">User Management</h3>
        <p className="text-sm text-muted-foreground">Add and manage users who can access the admin panel.</p>
      </div>

      {users ? (
        <UsersTable currentUser={user} initialUsers={users} />
      ) : (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">Error loading users. Please try again.</div>
      )}
    </div>
  )
}
