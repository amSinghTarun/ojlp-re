// app/admin/journals/new/page.tsx - WITH SIMPLE PERMISSION CHECKS
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssueForm } from "@/components/admin/journal-issue-form"
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

export default async function NewJournalIssuePage() {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Check if user has permission to create journal issues
  const journalIssueCreateCheck = checkPermission(currentUser, 'journalissue.CREATE')
  
  if (!journalIssueCreateCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading="Create New Journal Issue" 
          text="Create a new journal issue. You can add articles to it after creation." 
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'journalissue.CREATE' permission to create new journal issues.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // User has permission - show the actual component
  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading="Create New Journal Issue" 
        text="Create a new journal issue. You can add articles to it after creation." 
      />
      <JournalIssueForm />
    </div>
  )
}