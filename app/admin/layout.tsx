// app/admin/layout.tsx
import React from "react"
import { AdminSidebar } from '@/components/admin/sidebar'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@prisma/client'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Don't apply auth check to login page
  const user = await getCurrentUser()
  console.log("USER", user)

  if (!user) {
    redirect("/admin/login")
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar user={user as User} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}