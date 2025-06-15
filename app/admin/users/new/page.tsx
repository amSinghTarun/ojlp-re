import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { UserForm } from "@/components/admin/user-form"

export const metadata: Metadata = {
  title: "Add New User",
  description: "Add a new user to the admin panel",
}

export default async function NewUserPage() {
  const user = await getCurrentUser()

  // Only users with MANAGE_USERS permission can access this page
  if (!user || !hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
    redirect("/admin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Add New User</h3>
        <p className="text-sm text-muted-foreground">Create a new user account with admin panel access.</p>
      </div>
      <UserForm />
    </div>
  )
}
