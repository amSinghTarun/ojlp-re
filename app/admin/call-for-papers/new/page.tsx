import { DashboardHeader } from "@/components/admin/dashboard-header"
import { CallForPapersForm } from "@/components/admin/call-for-papers-form"

export default function NewCallForPapersPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader heading="Create New Call for Papers" text="Create a new call for papers announcement." />
      <CallForPapersForm />
    </div>
  )
}
