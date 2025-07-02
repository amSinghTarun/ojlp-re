// app/admin/users/page.tsx - Updated for simplified schema
import type { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth"
import { UsersTable } from "@/components/admin/users-table"
import { getUsers } from "@/lib/actions/user-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Users, Shield, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users who can access the admin panel",
}

export default async function UsersPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Authentication required. Please log in to access user management.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  try {
    // Fetch users from the database using the proper action
    const { users, error } = await getUsers()

    if (error) {
      throw new Error(error)
    }

    if (!users) {
      throw new Error("No users data received")
    }

    // Calculate some stats
    const totalUsers = users.length
    const roleStats = users.reduce((acc, user) => {
      acc[user.role.name] = (acc[user.role.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recentUsers = users
      .filter(user => {
        const daysSinceCreated = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceCreated <= 7
      })
      .length

    // Calculate permission stats
    const usersWithDirectPermissions = users.filter(user => user.permissions && user.permissions.length > 0).length

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h3 className="text-2xl font-bold">User Management</h3>
          <p className="text-muted-foreground">
            Manage users who can access the admin panel and their permissions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Active user accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentUsers}</div>
              <p className="text-xs text-muted-foreground">
                Created in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Permissions</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersWithDirectPermissions}</div>
              <p className="text-xs text-muted-foreground">
                Users with direct permissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role Distribution</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(roleStats).slice(0, 3).map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center text-sm">
                    <span className="truncate">{role}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
                {Object.keys(roleStats).length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{Object.keys(roleStats).length - 3} more roles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        {users.length > 0 ? (
          <UsersTable currentUser={currentUser} initialUsers={users} />
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
            <UsersTable currentUser={currentUser} initialUsers={[]} />
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error loading users page:", error)
    
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h3 className="text-2xl font-bold">User Management</h3>
          <p className="text-muted-foreground">
            Manage users who can access the admin panel and their permissions.
          </p>
        </div>

        {/* Error Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load users. Please check your database connection and try again.
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer">Error Details (Development)</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>

        {/* Fallback table with empty state */}
        <UsersTable currentUser={currentUser} initialUsers={[]} />
      </div>
    )
  }
}