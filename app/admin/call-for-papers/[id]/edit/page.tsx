import { DashboardHeader } from "@/components/admin/dashboard-header"
import { CallForPapersForm } from "@/components/admin/call-for-papers-form"
import { callsForPapers } from "@/lib/journal-data"
import { notFound } from "next/navigation"

interface EditCallForPapersPageProps {
  params: {
    id: string
  }
}

export default function EditCallForPapersPage({ params }: EditCallForPapersPageProps) {
  // In a real application, you would fetch this data from your database
  const cfp = callsForPapers.find((cfp) => cfp.id.toString() === params.id)

  if (!cfp) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <DashboardHeader heading={`Edit Call for Papers: ${cfp.title}`} text="Edit your call for papers details." />
      <CallForPapersForm cfp={cfp} />
    </div>
  )
}
