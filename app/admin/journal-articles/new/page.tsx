// app/admin/journal-articles/new/page.tsx - WITH SIMPLE PERMISSION CHECKS
import React from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticleForm } from "@/components/admin/journal-article-form"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  SYSTEM_PERMISSIONS, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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

export default async function NewJournalArticlePage() {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Check if user has permission to create articles
  const articleCreateCheck = checkPermission(currentUser, 'article.CREATE')
  
  if (!articleCreateCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading="Create New Journal Article" 
          text="Create a new journal article. You can save it as a draft or publish it immediately." 
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'article.CREATE' permission to create new journal articles.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // User has permission - show the actual component
  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading="Create New Journal Article" 
        text="Create a new journal article. You can save it as a draft or publish it immediately." 
      />
      <JournalArticleForm />
    </div>
  )
}