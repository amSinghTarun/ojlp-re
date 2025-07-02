// app/admin/users/new/page.tsx - Updated for simplified schema
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { UserForm } from "@/components/admin/user-form"
import { getRoles } from "@/lib/actions/user-actions"

export const metadata: Metadata = {
  title: "Create New User",
  description: "Add a new user to the system",
}

export default async function NewUserPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/admin/login")
  }

  try {
    // Get available roles
    const { roles, error } = await getRoles()

    if (error || !roles) {
      throw new Error(error || "Failed to load roles")
    }

    return (
      <UserForm
        currentUser={currentUser}
        availableRoles={roles}
        mode="create"
      />
    )
  } catch (error) {
    console.error("Error loading new user page:", error)
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error Loading Page</h1>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Failed to load the user creation form"}
          </p>
          <a 
            href="/admin/users" 
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Users
          </a>
        </div>
      </div>
    )
  }
}