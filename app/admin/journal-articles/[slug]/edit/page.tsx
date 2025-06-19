import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticleForm } from "@/components/admin/journal-article-form"
import { getJournalArticle } from "@/lib/actions/journal-article-actions"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { notFound, redirect } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileText, Eye, Calendar, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EditJournalArticlePageProps {
  params: {
    slug: string
  }
}

export default async function EditJournalArticlePage({ params }: EditJournalArticlePageProps) {
  // Check authentication and permissions
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  if (!hasPermission(user, PERMISSIONS.MANAGE_ARTICLES)) {
    redirect("/admin")
  }

  // Fetch journal article from database
  const result = await getJournalArticle(params.slug)
  
  if (result.error) {
    if (result.error.includes("not found")) {
      notFound()
    }
    
    // Show error page for other errors
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading="Edit Journal Article" 
          text="Edit journal article content and metadata." 
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load journal article: {result.error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const article = result.article!

  // Transform the article data to match the form interface
  const formArticle = {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    date: article.date,
    readTime: article.readTime,
    image: article.image,
    images: article.images,
    authorId: article.Author?.id,
    issueId: article.journalIssue?.id || null,
    doi: article.doi,
    keywords: article.keywords,
    draft: article.draft,
    Author: article.Author,
    journalIssue: article.journalIssue,
    categories: article.categories,
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading={`Edit Article: ${article.title}`} 
        text="Edit your journal article content and metadata." 
      />
      
      {/* Article Info */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{article.title}</h3>
              <Badge variant={article.draft ? "secondary" : "default"}>
                {article.draft ? "Draft" : "Published"}
              </Badge>
              {article.doi && (
                <Badge variant="outline">DOI: {article.doi}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{article.Author?.name || "No Author"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{article.readTime} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.views} views</span>
              </div>
            </div>
            {article.journalIssue && (
              <div className="text-sm">
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="ml-1 font-medium">
                  Volume {article.journalIssue.volume}, Issue {article.journalIssue.issue} ({article.journalIssue.year})
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Last Updated</p>
            <p className="text-sm text-muted-foreground">{new Date(article.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <JournalArticleForm article={formArticle} />
    </div>
  )
}