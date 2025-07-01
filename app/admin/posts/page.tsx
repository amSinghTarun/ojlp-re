// app/admin/posts/page.tsx - WITH SIMPLE PERMISSION CHECKS
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { PostsTable } from "@/components/admin/posts-table"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, PlusCircle } from "lucide-react"
import Link from "next/link"

// Get current user with permissions helper
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

export default async function PostsPage() {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Check if user has permission to view posts
  const postReadCheck = checkPermission(currentUser, 'post.READ')
  
  if (!postReadCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader heading="Posts" text="Create and manage your blog posts." />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'post.READ' permission to view posts.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if user can create posts (for showing/hiding the New Post button)
  const canCreatePosts = checkPermission(currentUser, 'post.CREATE').allowed

  // User has permission - show the actual component
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Posts" text="Create and manage your blog posts." />
        {canCreatePosts && (
          <Button asChild>
            <Link href="/admin/posts/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        )}
      </div>
      
      {/* Permission Info Alert */}
      {!canCreatePosts && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to posts. Contact your administrator to request creation permissions.
          </AlertDescription>
        </Alert>
      )}
      
      <PostsTable />
    </div>
  )
}