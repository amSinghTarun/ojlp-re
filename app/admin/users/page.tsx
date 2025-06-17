import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { UsersTable } from "@/components/admin/users-table"
import { getUsers } from "@/lib/controllers/users"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

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

  try {
    // Fetch users directly from the database using the controller
    const users = await getUsers()

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">User Management</h3>
          <p className="text-sm text-muted-foreground">
            Add and manage users who can access the admin panel.
          </p>
        </div>

        {users && users.length > 0 ? (
          <UsersTable currentUser={user} initialUsers={users} />
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No users found in the system. This might indicate a database connectivity issue
                or the system hasn't been properly initialized.
              </AlertDescription>
            </Alert>
            
            {/* Fallback table with empty state */}
            <UsersTable currentUser={user} initialUsers={[]} />
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error loading users:", error)
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">User Management</h3>
          <p className="text-sm text-muted-foreground">
            Add and manage users who can access the admin panel.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load users. Please check your database connection and try again.
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer">Error Details (Development)</summary>
                <pre className="mt-2 text-xs overflow-x-auto">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>

        {/* Fallback table with empty state */}
        <UsersTable currentUser={user} initialUsers={[]} />
      </div>
    )
  }
}