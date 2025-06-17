import type React from "react"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { User } from "@/lib/types"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // // Get the current user from the session
  const user = await getCurrentUser()

  // // If not authenticated, redirect to login
  // if (!user) {
  //   redirect("/admin/login")
  // }

  // Check if user has permission to access admin panel
  // if (!hasPermission(user, PERMISSIONS.VIEW_DASHBOARD)) {
  //   // Redirect to unauthorized page or homepage
  //   redirect("/")
  // }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {user && <AdminSidebar user={user as User} />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}