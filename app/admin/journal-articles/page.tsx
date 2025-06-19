import Link from "next/link"
import { Plus, FileText, Eye, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticlesTable } from "@/components/admin/journal-articles-table"
import { getJournalArticles } from "@/lib/actions/journal-article-actions"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function JournalArticlesPage() {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    if (!hasPermission(user, PERMISSIONS.MANAGE_ARTICLES)) {
      redirect("/admin")
    }

    console.log("📰 Admin page: Fetching journal articles...")

    // Fetch journal articles from database
    const result = await getJournalArticles()
    
    console.log("📥 Admin page: Server response:", result)

    if (result.error) {
      console.error("❌ Admin page: Error fetching data:", result.error)
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <DashboardHeader
              heading="Journal Articles"
              text="Create and manage journal articles."
            />
            <Button asChild>
              <Link href="/admin/journal-articles/new">
                <Plus className="mr-2 h-4 w-4" />
                New Article
              </Link>
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load journal articles: {result.error}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Transform database data to match table requirements
    const articlesForTable = result.articles?.map(article => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      date: article.date.toISOString(),
      readTime: article.readTime,
      image: article.image,
      draft: article.draft,
      views: article.views,
      doi: article.doi,
      keywords: article.keywords,
      Author: article.Author,
      journalIssue: article.journalIssue,
      categories: article.categories?.map(cat => cat.category) || [],
    })) || []

    // Calculate stats
    const publishedCount = articlesForTable.filter(article => !article.draft).length
    const draftCount = articlesForTable.filter(article => article.draft).length
    const totalViews = articlesForTable.reduce((sum, article) => sum + article.views, 0)

    console.log("✅ Admin page: Transformed data for table:", articlesForTable.length, "records")

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Journal Articles"
            text="Create and manage journal articles."
          />
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/journals">
                <FileText className="mr-2 h-4 w-4" />
                Manage Issues
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/journal-articles/new">
                <Plus className="mr-2 h-4 w-4" />
                New Article
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Total Articles</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{articlesForTable.length}</p>
            <p className="text-sm text-muted-foreground">All journal articles</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Published</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{publishedCount}</p>
            <p className="text-sm text-muted-foreground">Live articles</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">Drafts</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{draftCount}</p>
            <p className="text-sm text-muted-foreground">Work in progress</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Total Views</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{totalViews.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Article views</p>
          </div>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert variant="outline">
            <AlertDescription>
              <strong>Debug:</strong> Loaded {articlesForTable.length} journal article(s). Check console for detailed logs.
            </AlertDescription>
          </Alert>
        )}

        <JournalArticlesTable initialArticles={articlesForTable} />
      </div>
    )
  } catch (error) {
    console.error("💥 Admin page: Unexpected error:", error)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Journal Articles"
            text="Create and manage journal articles."
          />
          <Button asChild>
            <Link href="/admin/journal-articles/new">
              <Plus className="mr-2 h-4 w-4" />
              New Article
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