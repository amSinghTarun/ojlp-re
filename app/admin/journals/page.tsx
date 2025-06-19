import Link from "next/link"
import { Plus, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalIssuesTable } from "@/components/admin/journal-issues-table"
import { getJournalIssues } from "@/lib/actions/journal-actions"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function JournalsPage() {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    if (!hasPermission(user, PERMISSIONS.MANAGE_JOURNALS)) {
      redirect("/admin")
    }

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
            <Button asChild>
              <Link href="/admin/journals/new">
                <Plus className="mr-2 h-4 w-4" />
                New Issue
              </Link>
            </Button>
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

    // Transform database data to match table requirements
    const issuesForTable = result.issues?.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      volume: issue.volume,
      issue: issue.issue,
      year: issue.year,
      publishDate: issue.publishDate,
      coverImage: issue.coverImage,
      articleCount: issue._count?.articles || 0,
      articles: issue.articles || [],
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
            <Button asChild>
              <Link href="/admin/journals/new">
                <Plus className="mr-2 h-4 w-4" />
                New Issue
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
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
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert variant="outline">
            <AlertDescription>
              <strong>Debug:</strong> Loaded {issuesForTable.length} journal issue(s). Check console for detailed logs.
            </AlertDescription>
          </Alert>
        )}

        <JournalIssuesTable initialIssues={issuesForTable} />
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
          <Button asChild>
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