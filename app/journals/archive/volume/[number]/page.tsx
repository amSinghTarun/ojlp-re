import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getVolumeByNumber, getArticlesByIssue } from "@/lib/journal-data"

interface VolumeDetailPageProps {
  params: { number: string }
}

export default function VolumeDetailPage({ params }: VolumeDetailPageProps) {
  const volumeNumber = Number.parseInt(params.number, 10)

  if (isNaN(volumeNumber)) {
    notFound()
  }

  const volume = getVolumeByNumber(volumeNumber)

  if (!volume) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-2">
            <Link
              href="/journals/archive"
              className="flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back to Archive</span>
            </Link>
          </div>

          <div className="mb-8 animate-slide-up">
            <DecorativeHeading level={1}>Volume {volume.number}</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              {volume.title} • Published in {volume.year} • {volume.issueCount}{" "}
              {volume.issueCount === 1 ? "issue" : "issues"}
            </p>
          </div>

          <div className="space-y-8">
            {volume.issues.map((issue, issueIndex) => {
              const articles = getArticlesByIssue(volume.number, issue.issue)

              return (
                <div key={issue.id} className="border rounded-lg p-6 bg-card">
                  <h2 className="text-2xl font-serif mb-4">
                    Issue {issue.issue}: {issue.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">{issue.description}</p>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <Card>
                        <div className="relative aspect-[3/4] w-full overflow-hidden">
                          <Image
                            src={issue.coverImage || "/placeholder.svg?height=600&width=400&query=law journal cover"}
                            alt={issue.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardHeader>
                          <CardTitle className="text-xl">
                            Volume {issue.volume}, Issue {issue.issue} ({issue.year})
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">Published {issue.publishDate}</p>
                        </CardHeader>
                      </Card>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <h3 className="text-xl font-medium">Articles in this Issue</h3>

                      {articles.map((article, articleIndex) => (
                        <ScrollReveal key={article.slug} delay={articleIndex * 100}>
                          <Card>
                            <CardHeader>
                              <Link href={`/journals/${article.slug}`} className="hover:underline">
                                <CardTitle className="text-lg">{article.title}</CardTitle>
                              </Link>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{article.date}</span>
                                <span>•</span>
                                <span>{article.author}</span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{article.excerpt}</p>

                              {/* Display keywords */}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {article.keywords?.map((keyword) => (
                                  <Badge
                                    key={keyword}
                                    className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-xs"
                                  >
                                    {keyword}
                                  </Badge>
                                ))}
                                {/* Fallback to categories if keywords aren't available */}
                                {!article.keywords?.length &&
                                  article.categories?.map((category) => (
                                    <Badge
                                      key={category}
                                      className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-xs"
                                    >
                                      {category}
                                    </Badge>
                                  ))}
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/journals/${article.slug}`}>Read Article</Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
