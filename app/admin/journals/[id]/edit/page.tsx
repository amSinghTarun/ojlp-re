import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssueForm } from "@/components/admin/journal-issue-form"
import { journalIssues } from "@/lib/journal-data"
import { notFound } from "next/navigation"

interface EditJournalIssuePageProps {
  params: {
    id: string
  }
}

export default function EditJournalIssuePage({ params }: EditJournalIssuePageProps) {
  // In a real application, you would fetch this data from your database
  const issue = journalIssues.find((issue) => issue.id === params.id)

  if (!issue) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading={`Edit Journal Issue: ${issue.title}`}
        text="Edit your journal issue details and articles."
      />
      <JournalIssueForm issue={issue} />
    </div>
  )
}
