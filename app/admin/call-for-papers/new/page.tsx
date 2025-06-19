import { DashboardHeader } from "@/components/admin/dashboard-header"
import { CallForPapersForm } from "@/components/admin/call-for-papers-form"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { redirect } from "next/navigation"

export default async function NewCallForPapersPage() {
  // Check authentication and permissions
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  if (!hasPermission(user, PERMISSIONS.MANAGE_CALL_FOR_PAPERS)) {
    redirect("/admin")
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading="Create Call for Papers" 
        text="Create a new call for papers for your journal." 
      />
      <CallForPapersForm />
    </div>
  )
}