import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssuesTable } from "@/components/admin/journal-issues-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { getJournalIssues } from "@/lib/actions/journal-actions"

export default async function JournalIssuesPage() {
  const { issues, error } = await getJournalIssues()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Journal Issues" text="Create and manage journal issues." />
        <Button asChild>
          <Link href="/admin/journals/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Journal Issue
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">{error}</div>
      ) : (
        <JournalIssuesTable initialIssues={issues || []} />
      )}
    </div>
  )
}
