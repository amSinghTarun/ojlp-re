// app/admin/journal-articles/page.tsx - UPDATED for multiple authors
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

    // Fetch journal articles from database (now returns articles with multiple authors)
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

    // Transform database data to match table requirements - UPDATED for multiple authors
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
      views: article.views || 0,
      doi: article.doi,
      keywords: article.keywords,
      // UPDATED: Pass both old Author field (for backward compatibility) and new Authors array
      Author: article.Author, // This is the primary author from the updated server action
      Authors: article.Authors, // This is the full authors array
      journalIssue: article.journalIssue,
      categories: article.categories?.map(cat => cat.category) || [],
    })) || []

    // Calculate stats - UPDATED to handle cases where articles might not have authors
    const publishedCount = articlesForTable.filter(article => !article.draft).length
    const draftCount = articlesForTable.filter(article => article.draft).length
    const totalViews = articlesForTable.reduce((sum, article) => sum + (article.views || 0), 0)
    const totalAuthors = new Set(
      articlesForTable.flatMap(article => 
        article.Authors?.map(author => author.id) || 
        (article.Author ? [article.Author.id] : [])
      )
    ).size

    console.log("✅ Admin page: Transformed data for table:", articlesForTable.length, "records")
    console.log("📊 Admin page: Stats calculated:", { publishedCount, draftCount, totalViews, totalAuthors })

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

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{articlesForTable.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-orange-600">{draftCount}</p>
              </div>
              <PenTool className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Additional Stats for Multiple Authors */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Author Statistics</h3>
              <p className="text-sm text-muted-foreground">
                {totalAuthors} unique authors contributing to {articlesForTable.length} articles
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Average Authors per Article</p>
              <p className="text-lg font-bold">
                {articlesForTable.length > 0 
                  ? (articlesForTable.reduce((sum, article) => 
                      sum + (article.Authors?.length || (article.Author ? 1 : 0)), 0
                    ) / articlesForTable.length).toFixed(1)
                  : "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <JournalArticlesTable articles={articlesForTable} />
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
            An unexpected error occurred while loading the page. Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}