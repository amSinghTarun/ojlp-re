// app/admin/posts/[slug]/edit/page.tsx - WITH SIMPLE PERMISSION CHECKS
import React from "react"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { PostForm } from "@/components/admin/post-form"
import { getPost } from "@/lib/actions/post-actions"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  PERMISSION_ERRORS,
  PermissionContext
} from "@/lib/permissions/types"
import { prisma } from "@/lib/prisma"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

interface EditPostPageProps {
  params: {
    slug: string
  }
}

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

// Loading component for the post data
function PostLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex justify-center items-center h-64 border rounded-lg">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading post data...</span>
        </div>
      </div>
    </div>
  )
}

// Error component for failed post loading
function PostErrorState({ error }: { error: string }) {
  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading="Error Loading Post" 
        text="There was an issue loading the post data." 
      />
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error:</strong> {error}
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Main edit post content component
async function EditPostContent({ slug, currentUser }: { slug: string, currentUser: UserWithPermissions }) {
  try {
    // Fetch post data from database first to get post details for permission context
    const result = await getPost(slug)
    
    if (!result.success) {
      if (result.error === "Post not found") {
        notFound()
      }
      return <PostErrorState error={result.error} />
    }

    const post = result.data

    // Check permissions to edit posts with context (users can edit their own posts)
    const context: PermissionContext = {
      resourceId: post.id,
      resourceOwner: post.Authors?.some(author => author.userId === currentUser.id) 
        ? currentUser.id 
        : post.Author?.userId,
      userId: currentUser.id
    }

    const postUpdateCheck = checkPermission(currentUser, 'article.UPDATE', context)
    
    if (!postUpdateCheck.allowed) {
      return (
        <div className="space-y-6">
          <DashboardHeader 
            heading={`Edit Post: ${post.title}`}
            text="Edit post content, authors, and settings."
          />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'article.UPDATE' permission to edit posts.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading={`Edit Post: ${post.title}`}
          text={`Edit your ${post.type} post content, authors, and settings.`}
        />
        <PostForm slug={slug} type={post.type as "blog" | "journal"} />
      </div>
    )
  } catch (error) {
    console.error("Failed to load post for editing:", error)
    return <PostErrorState error="An unexpected error occurred while loading the post." />
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = params

  // Validate slug parameter
  if (!slug || typeof slug !== 'string') {
    notFound()
  }

  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  return (
    <Suspense fallback={<PostLoadingState />}>
      <EditPostContent slug={slug} currentUser={currentUser} />
    </Suspense>
  )
}