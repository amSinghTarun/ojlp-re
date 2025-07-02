import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { CallForPapersTable } from "@/components/admin/call-for-papers-table"
import { getCallsForPapers } from "@/lib/actions/call-for-papers-actions"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  SYSTEM_PERMISSIONS, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileText, Calendar, Eye, Building, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Get current user with permissions helper
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

export default async function CallForPapersPage() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to view call for papers
    const callForPapersReadCheck = checkPermission(currentUser, 'callforpapers.READ')
    
    if (!callForPapersReadCheck.allowed) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <DashboardHeader
              heading="Call for Papers"
              text="Manage your journal's call for papers and submissions."
            />
          </div>

          <div className="rounded-lg border border-dashed p-8 text-center">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold">Access Denied</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You don't have permission to view call for papers. Please contact your administrator to request the necessary permissions.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/call-for-papers" target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    View Public CFPs
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Check if user can create call for papers (for showing Add New Call button)
    const canCreateCallForPapers = checkPermission(currentUser, 'callforpapers.CREATE').allowed

    // Check if user can edit call for papers (for showing edit actions in table)
    const canEditCallForPapers = checkPermission(currentUser, 'callforpapers.UPDATE').allowed

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
            {canCreateCallForPapers && (
              <Button asChild>
                <Link href="/admin/call-for-papers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Call
                </Link>
              </Button>
            )}
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

    // Transform database data to match table requirements (aligned with actual schema)
    const callsForTable = result.calls?.map(call => ({
      id: call.id,
      title: call.title,
      thematicFocus: call.thematicFocus,
      deadline: call.deadline.toISOString(), // Convert Date to ISO string
      volume: call.volume,
      issue: call.issue,
      year: call.year,
      publisher: call.publisher,
      fee: call.fee,
      contentLink: call.contentLink,
      topics: call.topics,
    })) || []

    console.log("✅ Admin page: Transformed data for table:", callsForTable.length, "records")

    // Calculate statistics
    const totalCalls = callsForTable.length
    const activeCalls = callsForTable.filter(call => new Date(call.deadline) > new Date()).length
    const expiredCalls = totalCalls - activeCalls
    const currentYear = new Date().getFullYear()
    const thisYearCalls = callsForTable.filter(call => call.year === currentYear).length
    const callsWithFee = callsForTable.filter(call => call.fee && call.fee.trim() !== "").length
    const callsWithSubmissionLink = callsForTable.filter(call => call.contentLink && call.contentLink.trim() !== "").length

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Call for Papers"
            text="Manage your journal's call for papers and submissions."
          />
          {canCreateCallForPapers && (
            <Button asChild>
              <Link href="/admin/call-for-papers/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Call
              </Link>
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCalls}</div>
              <p className="text-xs text-muted-foreground">
                All published calls for papers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCalls}</div>
              <p className="text-xs text-muted-foreground">
                {totalCalls > 0 ? Math.round((activeCalls / totalCalls) * 100) : 0}% accepting submissions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Year</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisYearCalls}</div>
              <p className="text-xs text-muted-foreground">
                Calls for {currentYear}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Submission Links</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callsWithSubmissionLink}</div>
              <p className="text-xs text-muted-foreground">
                {totalCalls > 0 ? Math.round((callsWithSubmissionLink / totalCalls) * 100) : 0}% have external links
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Statistics Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Calls</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiredCalls}</div>
              <p className="text-xs text-muted-foreground">
                {totalCalls > 0 ? Math.round((expiredCalls / totalCalls) * 100) : 0}% past deadline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callsWithFee}</div>
              <p className="text-xs text-muted-foreground">
                {totalCalls > 0 ? Math.round((callsWithFee / totalCalls) * 100) : 0}% require payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalCalls - callsWithFee}</div>
              <p className="text-xs text-muted-foreground">
                {totalCalls > 0 ? Math.round(((totalCalls - callsWithFee) / totalCalls) * 100) : 0}% no submission fee
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert variant="outline">
            <AlertDescription>
              <strong>Debug:</strong> Loaded {callsForTable.length} call(s) for papers. Check console for detailed logs.
            </AlertDescription>
          </Alert>
        )}

        {/* Call for Papers Table with Permission Context */}
        <CallForPapersTable 
          initialCalls={callsForTable} 
        />

        {/* Permission Notice for Read-Only Users */}
        {!canEditCallForPapers && !canCreateCallForPapers && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  You have read-only access to call for papers. Contact an administrator for create or edit permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State with Permission Context */}
        {callsForTable.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No call for papers found</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {canCreateCallForPapers 
                  ? "Get started by creating your first call for papers to invite submissions."
                  : "No call for papers have been created yet."
                }
              </p>
              {canCreateCallForPapers && (
                <Button asChild>
                  <Link href="/admin/call-for-papers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Call
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
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
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An unexpected error occurred while loading the page. Please check the console for more details or contact support if the problem persists.
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer">Error Details (Development)</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">
                  {error instanceof Error ? error.stack || error.message : String(error)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold">Unable to Load Page</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              There was a problem loading the call for papers page. Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/call-for-papers" target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View Public CFPs
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin">
                  Go to Dashboard
                </Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}