import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticleForm } from "@/components/admin/journal-article-form"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function NewJournalArticlePage() {
  // Check authentication and permissions
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

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