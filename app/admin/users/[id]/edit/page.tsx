import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { UserForm } from "@/components/admin/user-form"
import { getUser, getRoles } from "@/lib/actions/user-actions"

interface EditUserPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditUserPageProps): Promise<Metadata> {
  try {
    const { user } = await getUser(params.id)
    
    return {
      title: user ? `Edit User: ${user.name}` : "Edit User",
      description: user ? `Edit user profile and permissions for ${user.name}` : "Edit user profile and permissions",
    }
  } catch {
    return {
      title: "Edit User",
      description: "Edit user profile and permissions",
    }
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const currentUser = await getCurrentUser()

  try {
    // Get user and roles data
    const [userResult, rolesResult] = await Promise.all([
      getUser(params.id),
      getRoles()
    ])

    const { user, error: userError } = userResult
    const { roles, error: rolesError } = rolesResult

    // Handle errors
    if (userError || !user) {
      if (userError === "User not found") {
        notFound()
      }
      throw new Error(userError || "Failed to load user")
    }

    if (rolesError || !roles) {
      throw new Error(rolesError || "Failed to load roles")
    }

    // Additional permission checks
    if (!isSuperAdmin(currentUser)) {
      // Non-super admins cannot edit super admins
      if (user.role.name === "Super Admin") {
        redirect("/admin/users")
      }
    }

    // Prevent editing self through this interface
    if (user.id === currentUser.id) {
      redirect("/admin/profile") // Redirect to profile page instead
    }

    return (
      <UserForm
        user={user}
        currentUser={currentUser}
        availableRoles={roles}
        mode="edit"
      />
    )
  } catch (error) {
    console.error("Error loading edit user page:", error)
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error Loading User</h1>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Failed to load the user edit form"}
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
