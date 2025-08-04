// app/admin/journal-articles/[slug]/edit/page.tsx - Fixed field mapping
import React from "react"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { JournalArticleForm } from "@/components/admin/journal-article-form"
import { getJournalArticle } from "@/lib/actions/journal-article-actions"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { 
  UserWithPermissions, 
  PERMISSION_ERRORS,
  PermissionContext
} from "@/lib/permissions/types"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileText, Eye, Calendar, Users, BookOpen, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

interface EditJournalArticlePageProps {
  params: {
    slug: string
  }
}

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

export default async function EditJournalArticlePage({ params }: EditJournalArticlePageProps) {
  // Check authentication
  const currentUser = await getCurrentUserWithPermissions()
  if (!currentUser) {
    redirect("/admin/login")
  }

  // Fetch journal article from database first to get article details for permission context
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

  // Check permissions to edit articles with context (users can edit their own articles)
  const context: PermissionContext = {
    resourceId: article.id,
    resourceOwner: article.Authors?.some(author => author.userId === currentUser.id) 
      ? currentUser.id 
      : undefined,
    userId: currentUser.id
  }

  const articleUpdateCheck = checkPermission(currentUser, 'article.UPDATE', context)
  
  if (!articleUpdateCheck.allowed) {
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading={`Edit Article: ${article.title}`} 
          text="Edit journal article content and metadata." 
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS} - You need 'article.UPDATE' permission to edit journal articles.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Transform the article data to match the updated form interface with correct field mapping
  const formArticle = {
    id: article.id,
    slug: article.slug,
    title: article.title,
    abstract: article.abstract, // Use abstract instead of excerpt
    content: article.content,
    contentLink: article.contentLink,
    publishedAt: article.publishedAt, // Use publishedAt instead of date
    readTime: article.readTime,
    image: article.image,
    issueId: article.journalIssue?.id || null,
    keywords: article.keywords || [],
    archived: article.archived, // Use archived instead of draft (inverted logic)
    featured: article.featured || false,
    carousel: article.carousel || false,
    Authors: article.Authors || [],
    journalIssue: article.journalIssue,
  }

  // Get primary author for display (first author)
  const primaryAuthor = article.Authors && article.Authors.length > 0 ? article.Authors[0] : null
  const authorCount = article.Authors?.length || 0

  // User has permission - show the actual component
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{article.title}</h3>
              <Badge variant={article.archived ? "secondary" : "default"}>
                {article.archived ? "Archived" : "Published"}
              </Badge>
              {article.featured && (
                <Badge variant="destructive">Featured</Badge>
              )}
              {article.carousel && (
                <Badge variant="outline">Carousel</Badge>
              )}
              {article.contentLink && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a 
                    href={article.contentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Full Article
                  </a>
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {/* Authors Display */}
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
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
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

            {/* Abstract Display */}
            {article.abstract && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Abstract:</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {article.abstract}
                </p>
              </div>
            )}

            {/* Content Link Display */}
            {article.contentLink && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Full Article Link:</p>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={article.contentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {article.contentLink}
                  </a>
                </div>
              </div>
            )}

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

            {/* Keywords Display */}
            {article.keywords && article.keywords.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Keywords:</p>
                <div className="flex flex-wrap gap-1">
                  {article.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
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
                {article.journalIssue.theme && (
                  <span className="text-muted-foreground">- {article.journalIssue.theme}</span>
                )}
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

      {/* Content Link Requirement Alert */}
      {!article.contentLink && (
        <Alert variant="destructive">
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            <strong>Missing Content Link:</strong> This journal article requires a link to the full content (PDF, DOI, or academic platform). Please add the content link in the form below.
          </AlertDescription>
        </Alert>
      )}

      {/* Missing Abstract Alert */}
      {!article.abstract && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Missing Abstract:</strong> This journal article is missing an abstract. Please add an abstract in the form below.
          </AlertDescription>
        </Alert>
      )}
      
      <JournalArticleForm article={formArticle} />
    </div>
  )
}