import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssueForm } from "@/components/admin/journal-issue-form"
import { getJournalIssue } from "@/lib/actions/journal-actions"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { notFound, redirect } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface EditJournalIssuePageProps {
  params: {
    id: string
  }
}

export default async function EditJournalIssuePage({ params }: EditJournalIssuePageProps) {
  // Check authentication and permissions
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  if (!hasPermission(user, PERMISSIONS.MANAGE_JOURNALS)) {
    redirect("/admin")
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

  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading={`Edit Journal Issue: ${issue.title}`} 
        text="Edit your journal issue details and manage articles." 
      />
      
      {/* Issue Info */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Issue Information</h3>
            <p className="text-sm text-muted-foreground">
              Volume {issue.volume}, Issue {issue.issue} ({issue.year}) • {issue.articles?.length || 0} articles
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Published: {new Date(issue.publishDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <JournalIssueForm issue={issue} />
    </div>
  )
}