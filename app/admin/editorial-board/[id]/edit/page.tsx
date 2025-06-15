import { DashboardHeader } from "@/components/admin/dashboard-header"
import { EditorialBoardForm } from "@/components/admin/editorial-board-form"
import { editorialBoardMembers } from "@/lib/editorial-board"
import { notFound } from "next/navigation"

interface EditEditorialBoardMemberPageProps {
  params: {
    id: string
  }
}

export default function EditEditorialBoardMemberPage({ params }: EditEditorialBoardMemberPageProps) {
  // In a real application, you would fetch this data from your database
  const member = editorialBoardMembers.find((member) => member.id === params.id)

  if (!member) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <DashboardHeader heading={`Edit Member: ${member.name}`} text="Edit editorial board member details." />
      <EditorialBoardForm member={member} />
    </div>
  )
}
