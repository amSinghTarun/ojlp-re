import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticleForm } from "@/components/admin/journal-article-form"

export default function NewJournalArticlePage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Create New Journal Article"
        text="Create a new journal article with content and metadata."
      />
      <JournalArticleForm />
    </div>
  )
}
