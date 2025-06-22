import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { CallForPapersTable } from "@/components/admin/call-for-papers-table"
import { getCallsForPapers } from "@/lib/actions/call-for-papers-actions"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function CallForPapersPage() {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    console.log("📋 Admin page: Fetching calls for papers...")

    // Fetch calls for papers from database
    const result = await getCallsForPapers()
    
    console.log("📥 Admin page: Server response:", result)

    if (result.error) {
      console.error("❌ Admin page: Error fetching data:", result.error)
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <DashboardHeader
              heading="Call for Papers"
              text="Manage your journal's call for papers and submissions."
            />
            <Button asChild>
              <Link href="/admin/call-for-papers/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Call
              </Link>
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load calls for papers: {result.error}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Transform database data to match table requirements
    const callsForTable = result.calls?.map(call => ({
      id: call.id,
      title: call.title,
      thematicFocus: call.thematicFocus,
      deadline: call.deadline.toISOString(), // Convert Date to ISO string
      volume: call.volume,
      issue: call.issue,
      year: call.year,
      image: call.image,
    })) || []

    console.log("✅ Admin page: Transformed data for table:", callsForTable.length, "records")

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Call for Papers"
            text="Manage your journal's call for papers and submissions."
          />
          <Button asChild>
            <Link href="/admin/call-for-papers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Call
            </Link>
          </Button>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert variant="outline">
            <AlertDescription>
              <strong>Debug:</strong> Loaded {callsForTable.length} call(s) for papers. Check console for detailed logs.
            </AlertDescription>
          </Alert>
        )}

        <CallForPapersTable initialCalls={callsForTable} />
      </div>
    )
  } catch (error) {
    console.error("💥 Admin page: Unexpected error:", error)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Call for Papers"
            text="Manage your journal's call for papers and submissions."
          />
          <Button asChild>
            <Link href="/admin/call-for-papers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Call
            </Link>
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An unexpected error occurred while loading the page. Please check the console for more details.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}