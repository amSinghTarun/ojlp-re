import { DashboardHeader } from "@/components/admin/dashboard-header"
import { BoardAdvisorsTable } from "@/components/admin/board-advisors-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { getBoardAdvisors } from "@/lib/actions/board-advisor-actions"

export default async function BoardAdvisorsPage() {
  const { advisors, error } = await getBoardAdvisors()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Board of Advisors" text="Manage members of the board of advisors." />
        <Button asChild>
          <Link href="/admin/board-advisors/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Advisor
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">{error}</div>
      ) : (
        <BoardAdvisorsTable initialAdvisors={advisors || []} />
      )}
    </div>
  )
}
