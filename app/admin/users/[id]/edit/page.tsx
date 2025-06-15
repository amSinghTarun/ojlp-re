import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser, getUserById } from "@/lib/auth"
import { hasPermission, PERMISSIONS, isSuperAdmin } from "@/lib/permissions"
import { UserForm } from "@/components/admin/user-form"

export const metadata: Metadata = {
  title: "Edit User",
  description: "Edit an existing user",
}

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const currentUser = await getCurrentUser()
  const userToEdit = await getUserById(params.id)

  // Only users with MANAGE_USERS permission can access this page
  if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
    redirect("/admin")
  }

  // If the user to edit is a SUPER_ADMIN, only another SUPER_ADMIN can edit them
  if (userToEdit?.role === "SUPER_ADMIN" && !isSuperAdmin(currentUser)) {
    redirect("/admin/users")
  }

  if (!userToEdit) {
    redirect("/admin/users")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Edit User</h3>
        <p className="text-sm text-muted-foreground">Update user information and access permissions.</p>
      </div>
      <UserForm user={userToEdit} />
    </div>
  )
}
