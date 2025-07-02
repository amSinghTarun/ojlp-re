// app/admin/journals/[id]/edit/page.tsx - Updated for actual schema
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssueForm } from "@/components/admin/journal-issue-form"
import { getJournalIssue } from "@/lib/actions/journal-actions"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface EditJournalIssuePageProps {
  params: {
    id: string
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

export default async function EditJournalIssuePage({ params }: EditJournalIssuePageProps) {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Check if user has permission to edit journal issues
  const journalIssueUpdateCheck = checkPermission(currentUser, 'journalissue.UPDATE')
  
  if (!journalIssueUpdateCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading="Edit Journal Issue" 
          text="Edit journal issue details." 
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'journalissue.UPDATE' permission to edit journal issues.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Fetch journal issue from database
  const result = await getJournalIssue(params.id)
  
  if (result.error) {
    if (result.error.includes("not found")) {
      notFound()
    }
    
    // Show error page for other errors
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading="Edit Journal Issue" 
          text="Edit journal issue details." 
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load journal issue: {result.error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const issue = result.issue!

  // User has permission - show the actual component
  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading={`Edit Journal Issue: Volume ${issue.volume}, Issue ${issue.issue} (${issue.year})`} 
        text="Edit your journal issue details and manage articles." 
      />
      
      {/* Issue Info */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Issue Information</h3>
            <p className="text-sm text-muted-foreground">
              Volume {issue.volume}, Issue {issue.issue} ({issue.year}) • {issue.Article?.length || 0} articles
              {issue.theme && (
                <span className="block">Theme: {issue.theme}</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {issue.publishDate ? `Published: ${new Date(issue.publishDate).toLocaleDateString()}` : 'No publish date set'}
            </p>
          </div>
        </div>
      </div>
      
      <JournalIssueForm issue={issue} />
    </div>
  )
}