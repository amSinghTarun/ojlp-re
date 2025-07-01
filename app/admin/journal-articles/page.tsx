// app/admin/journal-articles/page.tsx - WITH SIMPLE PERMISSION CHECKS
import Link from "next/link"
import { Plus, FileText, Eye, PenTool, ExternalLink, AlertTriangle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticlesTable } from "@/components/admin/journal-articles-table"
import { getJournalArticles } from "@/lib/actions/journal-article-actions"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  SYSTEM_PERMISSIONS, 
  PERMISSION_ERRORS 
} from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"

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

export default async function JournalArticlesPage() {
  try {
    // Check authentication
    const currentUser = await getCurrentUserWithPermissions()
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to view articles
    const articleReadCheck = checkPermission(currentUser, 'article.READ')
    
    if (!articleReadCheck.allowed) {
      return (
        <div className="space-y-6">
          <DashboardHeader heading="Journal Articles" text="Create and manage journal articles." />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'article.READ' permission to view journal articles.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Check if user can create articles (for showing/hiding the New Article button)
    const canCreateArticles = checkPermission(currentUser, 'article.CREATE').allowed

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
            {canCreateArticles && (
              <Button asChild>
                <Link href="/admin/journal-articles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Article
                </Link>
              </Button>
            )}
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
      contentLink: article.contentLink,
      date: article.date.toISOString(),
      readTime: article.readTime,
      image: article.image,
      draft: article.draft,
      views: article.views || 0,
      doi: article.doi,
      keywords: article.keywords,
      Author: article.Author,
      Authors: article.Authors,
      journalIssue: article.journalIssue,
      categories: article.categories?.map(cat => cat.category) || [],
      // Add permission context for the table
      canEdit: checkPermission(currentUser, 'article.UPDATE', {
        resourceOwner: article.Authors?.some(author => author.userId === currentUser.id) 
          ? currentUser.id 
          : article.Author?.userId,
        resourceId: article.id
      }).allowed,
      canDelete: checkPermission(currentUser, 'article.DELETE', {
        resourceOwner: article.Authors?.some(author => author.userId === currentUser.id) 
          ? currentUser.id 
          : article.Author?.userId,
        resourceId: article.id
      }).allowed,
    })) || []

    // Calculate stats
    const publishedCount = articlesForTable.filter(article => !article.draft).length
    const draftCount = articlesForTable.filter(article => article.draft).length
    const totalViews = articlesForTable.reduce((sum, article) => sum + (article.views || 0), 0)
    const totalAuthors = new Set(
      articlesForTable.flatMap(article => 
        article.Authors?.map(author => author.id) || 
        (article.Author ? [article.Author.id] : [])
      )
    ).size

    const articlesWithContentLinks = articlesForTable.filter(article => article.contentLink).length
    const articlesWithoutContentLinks = articlesForTable.filter(article => !article.contentLink).length

    const editableArticles = articlesForTable.filter(article => article.canEdit).length
    const deletableArticles = articlesForTable.filter(article => article.canDelete).length

    console.log("✅ Admin page: Transformed data for table:", articlesForTable.length, "records")

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DashboardHeader
            heading="Journal Articles"
            text="Create and manage journal articles with full content links."
          />
          {canCreateArticles && (
            <Button asChild>
              <Link href="/admin/journal-articles/new">
                <Plus className="mr-2 h-4 w-4" />
                New Article
              </Link>
            </Button>
          )}
        </div>

        {/* Permission Info Alert */}
        {!canCreateArticles && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You have read-only access to journal articles. Contact your administrator to request creation permissions.
            </AlertDescription>
          </Alert>
        )}

        {/* Content Link Warning Alert */}
        {articlesWithoutContentLinks > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention Required:</strong> {articlesWithoutContentLinks} article{articlesWithoutContentLinks !== 1 ? 's' : ''} missing content link{articlesWithoutContentLinks !== 1 ? 's' : ''}. 
              Journal articles require links to full content (PDF, DOI, etc.). Please update these articles.
            </AlertDescription>
          </Alert>
        )}

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

        {/* Enhanced Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Author Statistics */}
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

          {/* Content Link Statistics */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Content Link Status
                </h3>
                <p className="text-sm text-muted-foreground">
                  {articlesWithContentLinks} articles have full content links
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Coverage</p>
                <p className="text-lg font-bold">
                  {articlesForTable.length > 0 
                    ? Math.round((articlesWithContentLinks / articlesForTable.length) * 100)
                    : 0}%
                </p>
                {articlesWithoutContentLinks > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {articlesWithoutContentLinks} missing
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Permission Statistics */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Your Permissions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your access level for these articles
                </p>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <p className="text-sm font-medium">Can Edit</p>
                  <p className="text-lg font-bold text-blue-600">{editableArticles}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Can Delete</p>
                  <p className="text-lg font-bold text-red-600">{deletableArticles}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Link Requirements Info */}
        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            <strong>Content Link Requirement:</strong> All journal articles must include a link to the full content. 
            This can be a PDF link, DOI URL, or link to an academic platform (arXiv, PubMed, etc.). 
            Articles without content links will be flagged and may not be displayed properly to readers.
          </AlertDescription>
        </Alert>

        {/* Articles Table - Pass permission context */}
        <JournalArticlesTable 
          articles={articlesForTable} 
          currentUser={currentUser}
          canCreate={canCreateArticles}
        />
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
          <Button asChild disabled>
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