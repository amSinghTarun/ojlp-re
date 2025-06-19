import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { isSuperAdmin } from "@/lib/permissions"
import { PermissionForm } from "@/components/admin/permission-form"

export const metadata: Metadata = {
  title: "Create New Permission",
  description: "Create a new permission for the system",
}

export default async function NewPermissionPage() {
  const currentUser = await getCurrentUser()

  // Only super admins can create permissions
  if (!currentUser || !isSuperAdmin(currentUser)) {
    redirect("/admin")
  }

  return (
    <PermissionForm mode="create" />
  )
}
