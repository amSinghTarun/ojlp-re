import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Users, FileText, AlertTriangle, Loader2, BookOpen } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getVolumeByNumber } from "@/lib/controllers/journal-issues"

interface VolumeDetailPageProps {
  params: { number: string }
}

// Loading component for volume data
function VolumeLoadingState() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="space-y-2 text-center">
          <div className="h-12 w-80 bg-muted animate-pulse rounded mx-auto" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded mx-auto" />
        </div>
      </div>
      
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6 bg-card">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-4" />
          <div className="h-4 w-full bg-muted animate-pulse rounded mb-6" />
          
          <div className="space-y-4">
            {[...Array(2)].map((_, j) => (
              <Card key={j}>
                <CardHeader>
                  <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Error component for failed volume loading
function VolumeErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error loading volume:</strong> {error}
        </AlertDescription>
      </Alert>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
        <Button asChild variant="outline">
          <Link href="/journals/archive">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Archive
          </Link>
        </Button>
      </div>
    </div>
  )
}

// Main volume content component
async function VolumeContent({ volumeNumber }: { volumeNumber: number }) {
  try {
    const volume = await getVolumeByNumber(volumeNumber)
    
    if (!volume) {
      notFound()
    }

    return (
      <div className="space-y-8">
        <div className="mb-8 animate-slide-up">
          <DecorativeHeading level={1}>Volume {volume.number}</DecorativeHeading>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            {volume.title} • Published in {volume.year} • {volume.issueCount}{" "}
            {volume.issueCount === 1 ? "issue" : "issues"}
          </p>
        </div>

        {volume.issues && volume.issues.length > 0 ? (
          <div className="space-y-8">
            {volume.issues.map((issue, issueIndex) => (
              <ScrollReveal key={issue.id} delay={issueIndex * 100}>
                <div className="border rounded-lg p-6 bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-serif mb-2 flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        Issue {issue.issue}: {issue.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Published {issue.publishDate}</span>
                        </div>
                        <Badge variant="secondary">
                          Volume {issue.volume}, Issue {issue.issue} ({issue.year})
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">{issue.description}</p>

                  <div className="space-y-4">
                    <h3 className="text-xl font-medium flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Articles in this Issue
                      <Badge variant="outline" className="ml-2">
                        {issue.articles?.length || 0} articles
                      </Badge>
                    </h3>

                    {issue.articles && issue.articles.length > 0 ? (
                      <div className="grid gap-4">
                        {issue.articles.map((article, articleIndex) => (
                          <Card key={article.id} className="hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="pb-3">
                              <Link href={`/journals/${article.slug}`} className="hover:underline">
                                <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                              </Link>
                              
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(article.date).toLocaleDateString()}</span>
                                </div>
                                
                                {article.authors && article.authors.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      <span>
                                        {article.authors.map((authorArticle: any) => authorArticle.author.name).join(", ")}
                                      </span>
                                    </div>
                                  </>
                                )}
                                
                                {article.readTime && (
                                  <>
                                    <span>•</span>
                                    <span>{article.readTime} min read</span>
                                  </>
                                )}
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              <p className="text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                                {article.excerpt}
                              </p>

                              {/* Display keywords and DOI */}
                              <div className="space-y-2">
                                {article.keywords && article.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {article.keywords.map((keyword: string) => (
                                      <Badge
                                        key={keyword}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                {article.doi && (
                                  <p className="text-xs text-muted-foreground">
                                    <strong>DOI:</strong> {article.doi}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                            
                            <CardFooter className="pt-0 flex justify-between items-center">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/journals/${article.slug}`}>
                                  Read Article
                                </Link>
                              </Button>
                              
                              {article.draft && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  Draft
                                </Badge>
                              )}
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No articles published in this issue yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Issues Available</h3>
            <p>This volume doesn't have any issues published yet.</p>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error("Failed to load volume:", error)
    return <VolumeErrorState error="Failed to load volume data. Please try again later." />
  }
}

export default function VolumeDetailPage({ params }: VolumeDetailPageProps) {
  const volumeNumber = Number.parseInt(params.number, 10)

  if (isNaN(volumeNumber)) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-6">
            <Link
              href="/journals/archive"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back to Archive</span>
            </Link>
          </div>

          <Suspense fallback={<VolumeLoadingState />}>
            <VolumeContent volumeNumber={volumeNumber} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}