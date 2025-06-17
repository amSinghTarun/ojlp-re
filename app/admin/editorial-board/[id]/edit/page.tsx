import { DashboardHeader } from "@/components/admin/dashboard-header"
import { EditorialBoardForm } from "@/components/admin/editorial-board-form"
import { getEditorialBoardMember } from "@/lib/actions/editorial-board-actions"
import { notFound } from "next/navigation"

interface EditEditorialBoardMemberPageProps {
  params: {
    id: string
  }
}

export default async function EditEditorialBoardMemberPage({ params }: EditEditorialBoardMemberPageProps) {
  // Fetch member data from database
  const result = await getEditorialBoardMember(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const member = result.data

  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading={`Edit Member: ${member.name}`} 
        text="Edit editorial board member details." 
      />
      <EditorialBoardForm member={member} />
    </div>
  )
}