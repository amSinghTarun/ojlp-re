// app/admin/journal-articles/page.tsx - Updated for actual schema
import Link from "next/link"
import { Plus, FileText, Eye, PenTool, ExternalLink, AlertTriangle, Shield, Archive, Star, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticlesTable } from "@/components/admin/journal-articles-table"
import { getJournalArticles } from "@/lib/actions/journal-article-actions"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
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

    // Check if user can create articles
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

    // Transform database data to match table requirements and handle field mappings
    const articlesForTable = result.articles?.map(article => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      abstract: article.abstract, // Use actual schema field
      excerpt: article.abstract, // For backward compatibility
      content: article.content,
      contentLink: article.contentLink,
      publishedAt: article.publishedAt?.toISOString(), // Use actual schema field
      date: article.publishedAt?.toISOString(), // For backward compatibility
      readTime: article.readTime,
      image: article.image,
      archived: article.archived, // Use actual schema field
      draft: article.archived, // For backward compatibility (same logic)
      featured: article.featured,
      carousel: article.carousel,
      views: article.views || 0,
      keywords: article.keywords,
      Author: article.Author,
      Authors: article.Authors,
      journalIssue: article.journalIssue,
      JournalIssue: article.journalIssue, // For backward compatibility
      // Add permission context for the table
      canEdit: checkPermission(currentUser, 'article.UPDATE').allowed,
      canDelete: checkPermission(currentUser, 'article.DELETE').allowed,
    })) || []

    // Calculate stats using actual schema fields
    const publishedCount = articlesForTable.filter(article => !article.archived).length
    const archivedCount = articlesForTable.filter(article => article.archived).length
    const featuredCount = articlesForTable.filter(article => article.featured).length
    const carouselCount = articlesForTable.filter(article => article.carousel).length
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

        {/* Articles Table */}
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