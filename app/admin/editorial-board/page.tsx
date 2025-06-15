import { DashboardHeader } from "@/components/admin/dashboard-header"
import { EditorialBoardTable } from "@/components/admin/editorial-board-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export default function EditorialBoardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Editorial Board" text="Manage the editorial board members." />
        <Button asChild>
          <Link href="/admin/editorial-board/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Member
          </Link>
        </Button>
      </div>
      <EditorialBoardTable />
    </div>
  )
}
