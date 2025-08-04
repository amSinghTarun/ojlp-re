// app/admin/media/page.tsx - WITH SIMPLE PERMISSION CHECKS
import React from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { MediaLibrary } from "@/components/admin/media-library"
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
import { AlertCircle, Upload } from "lucide-react"

export const dynamic = 'force-dynamic'

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

export default async function MediaPage() {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Check if user has permission to view media
  const mediaReadCheck = checkPermission(currentUser, 'media.READ')
  
  if (!mediaReadCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader heading="Media Library" text="Upload and manage images for your blog." />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'media.READ' permission to view media library.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if user can upload media (for showing/hiding the Upload button)
  const canUploadMedia = checkPermission(currentUser, 'media.CREATE').allowed

  // User has permission - show the actual component
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Media Library" text="Upload and manage images for your blog." />
      </div>
      
      {/* Permission Info Alert */}
      {!canUploadMedia && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to media library. Contact your administrator to request upload permissions.
          </AlertDescription>
        </Alert>
      )}
      
      <MediaLibrary />
    </div>
  )
}