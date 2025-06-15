import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticlesTable } from "@/components/admin/journal-articles-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { getJournalArticles } from "@/lib/actions/journal-article-actions"

export default async function JournalArticlesPage() {
  const { articles, error } = await getJournalArticles()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Journal Articles" text="Create and manage journal articles." />
        <Button asChild>
          <Link href="/admin/journal-articles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Journal Article
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">{error}</div>
      ) : (
        <JournalArticlesTable initialArticles={articles || []} />
      )}
    </div>
  )
}
