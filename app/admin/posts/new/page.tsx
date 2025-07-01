// app/admin/posts/new/page.tsx - WITH SIMPLE PERMISSION CHECKS
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { PostForm } from "@/components/admin/post-form"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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

export default async function NewPostPage() {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Check if user has permission to create posts
  const postCreateCheck = checkPermission(currentUser, 'post.CREATE')
  
  if (!postCreateCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading="Create New Post" 
          text="Create a new blog post with rich content, images, and multiple authors." 
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'post.CREATE' permission to create new posts.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // User has permission - show the actual component
  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading="Create New Post" 
        text="Create a new blog post with rich content, images, and multiple authors." 
      />
      <PostForm />
    </div>
  )
}