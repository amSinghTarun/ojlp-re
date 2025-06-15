import { DashboardHeader } from "@/components/admin/dashboard-header"
import { EditorialBoardForm } from "@/components/admin/editorial-board-form"

export default function NewEditorialBoardMemberPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader heading="Add Editorial Board Member" text="Add a new member to the editorial board." />
      <EditorialBoardForm />
    </div>
  )
}
