// app/journals/archive/volume/[number]/issue/[issueNumber]/page.tsx
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArticleCard } from "@/components/article-card"
import { 
  BookOpen, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  User, 
  ArrowLeft,
  Download,
  Clock
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getJournalIssueByVolumeAndIssue } from "@/lib/controllers/journal-issues"

interface PageProps {
  params: {
    number: string
    issueNumber: string
  }
}

// Loading component for articles
function ArticlesLoadingState() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <Card className="border border-border/60">
            <CardContent className="p-6">
              <div className="h-6 bg-muted/60 rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted/40 rounded w-1/4 mb-4" />
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-muted/40 rounded w-full" />
                <div className="h-3 bg-muted/40 rounded w-5/6" />
                <div className="h-3 bg-muted/40 rounded w-4/5" />
              </div>
              <div className="flex gap-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-5 bg-muted/40 rounded w-16" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

// Main issue content component
async function IssueContent({ volumeNumber, issueNumber }: { volumeNumber: number, issueNumber: number }) {
  try {
    const issue = await getJournalIssueByVolumeAndIssue(volumeNumber, issueNumber)
    
    if (!issue) {
      notFound()
    }

    return (
      <div>
        {/* Issue Header */}
        <div className="mb-3">
          <div className="mb-8 space-y-3 pt-10 relative">
            <h1 className="text-4xl md:text-5xl text-center text-stone-800">
              {issue.theme || `Volume ${volumeNumber}, Issue ${issueNumber}`}
            </h1>
          </div>

          {issue.theme && (
            <p className="text-muted-foreground leading-relaxed max-w-3xl mb-6">
              {issue.theme}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-stone-500">
            {issue.publishDate && (
              <>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Published: {new Date(issue.publishDate).toLocaleDateString("en-us", {
                    month: "long",
                    year: "numeric"
                  })}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator className="mb-6 text-stone-200" />

        {/* Articles List */}
        {issue.Article && issue.Article.length > 0 ? (
          <div className="space-y-6">
            <div className="space-y-4">
              {issue.Article.map((article: any, index: number) => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  index={index}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
            <h3 className="text-lg font-medium mb-2">No Articles Published</h3>
            <p className="text-muted-foreground">This issue does not contain any published articles yet.</p>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Failed to load issue:", error)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Alert variant="destructive" className="max-w-md border border-red-200 bg-red-50/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load the issue at this time. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}

export default function IssuePage({ params }: PageProps) {
  const volumeNumber = parseInt(params.number)
  const issueNumber = parseInt(params.issueNumber)

  if (isNaN(volumeNumber) || isNaN(issueNumber)) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6 max-w-5xl">
          {/* Issue Content */}
          <Suspense fallback={<ArticlesLoadingState />}>
            <IssueContent volumeNumber={volumeNumber} issueNumber={issueNumber} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const volumeNumber = parseInt(params.number)
  const issueNumber = parseInt(params.issueNumber)

  if (isNaN(volumeNumber) || isNaN(issueNumber)) {
    return {
      title: "Issue Not Found"
    }
  }

  try {
    const issue = await getJournalIssueByVolumeAndIssue(volumeNumber, issueNumber)
    
    if (!issue) {
      return {
        title: "Issue Not Found"
      }
    }

    const title = issue.theme 
      ? `${issue.theme} - Volume ${volumeNumber}, Issue ${issueNumber}`
      : `Volume ${volumeNumber}, Issue ${issueNumber}`

    return {
      title: `${title} | Legal Insight Journal`,
      description: issue.theme || `Browse articles from Volume ${volumeNumber}, Issue ${issueNumber} of Legal Insight Journal.`,
      openGraph: {
        title,
        description: issue.theme || `Browse articles from Volume ${volumeNumber}, Issue ${issueNumber} of Legal Insight Journal.`,
        type: 'website',
      }
    }
  } catch (error) {
    return {
      title: "Issue | Legal Insight Journal"
    }
  }
}