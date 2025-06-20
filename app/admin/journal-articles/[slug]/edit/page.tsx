// app/admin/journal-articles/[slug]/edit/page.tsx - UPDATED for multiple authors
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticleForm } from "@/components/admin/journal-article-form"
import { getJournalArticle } from "@/lib/actions/journal-article-actions"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { notFound, redirect } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileText, Eye, Calendar, Users, BookOpen } from "lucide-react"
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

  // Transform the article data to match the updated form interface with multiple authors
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
    issueId: article.journalIssue?.id || null,
    doi: article.doi,
    keywords: article.keywords,
    draft: article.draft,
    // UPDATED: Transform multiple authors to match the new form structure
    Authors: article.Authors, // This now contains an array of authors
    journalIssue: article.journalIssue,
    categories: article.categories,
  }

  // Get primary author for display (first author)
  const primaryAuthor = article.Authors && article.Authors.length > 0 ? article.Authors[0] : null
  const authorCount = article.Authors?.length || 0

  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading={`Edit Article: ${article.title}`} 
        text="Edit your journal article content and metadata." 
      />
      
      {/* Article Info - UPDATED to show multiple authors */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{article.title}</h3>
              <Badge variant={article.draft ? "secondary" : "default"}>
                {article.draft ? "Draft" : "Published"}
              </Badge>
              {article.doi && (
                <Badge variant="outline">DOI: {article.doi}</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {/* Authors Display - UPDATED */}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {authorCount === 1 ? (
                    primaryAuthor?.name || "No Author"
                  ) : authorCount > 1 ? (
                    `${primaryAuthor?.name} +${authorCount - 1} more`
                  ) : (
                    "No Authors"
                  )}
                </span>
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
                <span>{article.views || 0} views</span>
              </div>
            </div>

            {/* All Authors Display */}
            {article.Authors && article.Authors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Authors:</p>
                <div className="flex flex-wrap gap-2">
                  {article.Authors.map((author, index) => (
                    <Badge key={author.id} variant="outline" className="text-xs">
                      {index + 1}. {author.name}
                      {author.email && (
                        <span className="ml-1 text-muted-foreground">({author.email})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {article.journalIssue && (
              <div className="text-sm flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="ml-1 font-medium">
                  Volume {article.journalIssue.volume}, Issue {article.journalIssue.issue} ({article.journalIssue.year})
                </span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium">Last Updated</p>
            <p className="text-sm text-muted-foreground">
              {new Date(article.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Authors Summary Card */}
      {article.Authors && article.Authors.length > 1 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>Multi-Author Article:</strong> This article has {authorCount} authors. You can modify the author list and their order in the form below.
          </AlertDescription>
        </Alert>
      )}
      
      <JournalArticleForm article={formArticle} />
    </div>
  )
}