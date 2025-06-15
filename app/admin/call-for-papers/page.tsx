import { DashboardHeader } from "@/components/admin/dashboard-header"
import { CallForPapersTable } from "@/components/admin/call-for-papers-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { getCallsForPapers } from "@/lib/actions/call-for-papers-actions"

export default async function CallForPapersPage() {
  const { calls, error } = await getCallsForPapers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Call for Papers" text="Create and manage calls for papers." />
        <Button asChild>
          <Link href="/admin/call-for-papers/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Call for Papers
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">{error}</div>
      ) : (
        <CallForPapersTable initialCalls={calls || []} />
      )}
    </div>
  )
}
