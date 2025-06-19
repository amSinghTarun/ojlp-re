import { DashboardHeader } from "@/components/admin/dashboard-header"
import { CallForPapersForm } from "@/components/admin/call-for-papers-form"
import { getCallForPapers } from "@/lib/actions/call-for-papers-actions"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { notFound, redirect } from "next/navigation"

interface EditCallForPapersPageProps {
  params: {
    id: string
  }
}

export default async function EditCallForPapersPage({ params }: EditCallForPapersPageProps) {
  // Check authentication and permissions
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  if (!hasPermission(user, PERMISSIONS.MANAGE_CALL_FOR_PAPERS)) {
    redirect("/admin")
  }

  // Fetch call for papers from database
  const result = await getCallForPapers(params.id)
  
  if (result.error) {
    notFound()
  }

  const cfp = result.call!

  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading={`Edit Call for Papers: ${cfp.title}`} 
        text="Edit your call for papers details." 
      />
      <CallForPapersForm cfp={cfp} />
    </div>
  )
}