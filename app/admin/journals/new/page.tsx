import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssueForm } from "@/components/admin/journal-issue-form"

export default function NewJournalIssuePage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Create New Journal Issue"
        text="Create a new journal issue with articles and cover image."
      />
      <JournalIssueForm />
    </div>
  )
}
