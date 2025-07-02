// app/admin/journals/page.tsx - Updated for actual schema
import Link from "next/link"
import { Plus, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssuesTable } from "@/components/admin/journal-issues-table"
import { getJournalIssues } from "@/lib/actions/journal-actions"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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

export default async function JournalsPage() {
  try {
    // Check authentication
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to view journal issues
    const journalIssueReadCheck = checkPermission(currentUser, 'journalissue.READ')
    
    if (!journalIssueReadCheck.allowed) {
      return (
        <div className="space-y-6">
          <DashboardHeader heading="Journal Issues" text="Manage your journal issues and articles." />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'journalissue.READ' permission to view journal issues.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Check if user can create journal issues (for showing/hiding the New Issue button)
    const canCreateIssues = checkPermission(currentUser, 'journalissue.CREATE').allowed

    console.log("📚 Admin page: Fetching journal issues...")

    // Fetch journal issues from database
    const result = await getJournalIssues()
    
    console.log("📥 Admin page: Server response:", result)

    if (result.error) {
      console.error("❌ Admin page: Error fetching data:", result.error)
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <DashboardHeader
              heading="Journal Issues"
              text="Manage your journal issues and articles."
            />
            {canCreateIssues && (
              <Button asChild>
                <Link href="/admin/journals/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Issue
                </Link>
              </Button>
            )}
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load journal issues: {result.error}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Transform database data to match table requirements (only actual schema fields)
    const issuesForTable = result.issues?.map(issue => ({
      id: issue.id,
      volume: issue.volume,
      theme: issue.theme || undefined, // Optional field
      issue: issue.issue,
      year: issue.year,
      publishDate: issue.publishDate || undefined, // Optional field
      articleCount: issue._count?.Article || 0,
      articles: issue.Article || [],
    })) || []

    console.log("✅ Admin page: Transformed data for table:", issuesForTable.length, "records")

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Journal Issues"
            text="Manage your journal issues and articles."
          />
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/journal-articles">
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Articles
              </Link>
            </Button>
            {canCreateIssues && (
              <Button asChild>
                <Link href="/admin/journals/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Issue
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Permission Info Alert */}
        {!canCreateIssues && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have read-only access to journal issues. Contact your administrator to request creation permissions.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Total Issues</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{issuesForTable.length}</p>
            <p className="text-sm text-muted-foreground">Published journal issues</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Total Articles</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {issuesForTable.reduce((sum, issue) => sum + (issue.articleCount || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Across all issues</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Latest Year</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {issuesForTable.length > 0 ? Math.max(...issuesForTable.map(i => i.year)) : '-'}
            </p>
            <p className="text-sm text-muted-foreground">Most recent publication</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">With Themes</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {issuesForTable.filter(issue => issue.theme && issue.theme.trim()).length}
            </p>
            <p className="text-sm text-muted-foreground">Issues with themes</p>
          </div>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert variant="outline">
            <AlertDescription>
              <strong>Debug:</strong> Loaded {issuesForTable.length} journal issue(s). Check console for detailed logs.
            </AlertDescription>
          </Alert>
        )}

        <JournalIssuesTable initialIssues={issuesForTable} canCreate={canCreateIssues} />
      </div>
    )
  } catch (error) {
    console.error("💥 Admin page: Unexpected error:", error)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Journal Issues"
            text="Manage your journal issues and articles."
          />
          <Button asChild disabled>
            <Link href="/admin/journals/new">
              <Plus className="mr-2 h-4 w-4" />
              New Issue
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