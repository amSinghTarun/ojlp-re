import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssueForm } from "@/components/admin/journal-issue-form"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { redirect } from "next/navigation"

export default async function NewJournalIssuePage() {
  // Check authentication and permissions
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  if (!hasPermission(user, PERMISSIONS.MANAGE_JOURNALS)) {
    redirect("/admin")
  }

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