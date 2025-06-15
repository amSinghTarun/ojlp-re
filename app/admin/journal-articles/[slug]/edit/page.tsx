import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticleForm } from "@/components/admin/journal-article-form"
import { articles } from "@/lib/data"
import { notFound } from "next/navigation"

interface EditJournalArticlePageProps {
  params: {
    slug: string
  }
}

export default function EditJournalArticlePage({ params }: EditJournalArticlePageProps) {
  // In a real application, you would fetch this data from your database
  const article = articles.find((article) => article.slug === params.slug && article.type === "journal")

  if (!article) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading={`Edit Journal Article: ${article.title}`}
        text="Edit your journal article content and metadata."
      />
      <JournalArticleForm article={article} />
    </div>
  )
}
