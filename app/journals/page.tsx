import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, User } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JournalCitation } from "@/components/journal-citation"
import { JournalDownloadButton } from "@/components/journal-download-button"
import { ArticleContentProcessor } from "@/components/article-content-processor"
import { getLatestIssue } from "@/lib/controllers/journal-issues"
import { getArticlesByJournalIssue } from "@/lib/controllers/articles"
import { redirect } from "next/navigation"

export const revalidate = 3600 // Revalidate every hour

export default async function JournalsPage({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams.view

  // If view is call-for-papers, render the call for papers content
  if (view === "call-for-papers") {
    return redirect("/journals/call-for-papers")
  }

  // Otherwise, render the regular journals content or redirect to archive
  if (view === "archive") {
    return redirect("/journals/archive")
  }

  // Default journals content
  if (!view || view === "") {
    const latestIssue = await getLatestIssue()

    if (!latestIssue) {
      return (
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            <div className="container px-4 py-12 md:px-6">
              <div className="mb-8 animate-slide-up">
                <DecorativeHeading level={1}>LegalInsight Journal</DecorativeHeading>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                  No journal issues available yet. Check back soon!
                </p>
              </div>
            </div>
          </main>
        </div>
      )
    }

    const latestIssueArticles = await getArticlesByJournalIssue(latestIssue.id)

    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <div className="container px-4 py-12 md:px-6">
            <div className="mb-8 animate-slide-up">
              <DecorativeHeading level={1}>LegalInsight Journal</DecorativeHeading>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                Scholarly articles and analysis on constitutional law and legal developments.
              </p>
            </div>

            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1">
                  <Card>
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <Image
                        src={latestIssue.coverImage || "/placeholder.svg?height=600&width=400&query=law journal cover"}
                        alt={latestIssue.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Volume {latestIssue.volume}, Issue {latestIssue.issue} ({latestIssue.year})
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Published{" "}
                        {new Date(latestIssue.publishDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-bold mb-2">{latestIssue.title}</h3>
                      <p className="text-sm text-muted-foreground">{latestIssue.description}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <h2 className="text-2xl font-bold font-serif">In This Issue</h2>

                  {latestIssueArticles.length > 0 ? (
                    latestIssueArticles.map((article, index) => (
                      <ScrollReveal key={article.id} delay={index * 100}>
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <Link href={`/journals/${article.slug}`} className="hover:underline">
                                <CardTitle className="text-xl">{article.title}</CardTitle>
                              </Link>
                              <div className="flex gap-2">
                                <JournalCitation
                                  article={{
                                    title: article.title,
                                    slug: article.slug,
                                    date: article.date || article.createdAt,
                                    doi: article.doi || "",
                                    volume: latestIssue.volume,
                                    issue: latestIssue.issue,
                                    year: latestIssue.year,
                                    // Handle both old authors structure and new Author structure
                                    authors: article.Author ? [{
                                      id: article.Author.id,
                                      name: article.Author.name,
                                      slug: article.Author.slug || article.Author.email,
                                    }] : (article.authors?.map(authorRel => ({
                                      id: authorRel.authorId,
                                      name: authorRel.author?.name || "Unknown Author",
                                      slug: authorRel.author?.slug || "",
                                    })) || []),
                                    author: article.Author?.name || article.authors?.[0]?.author?.name || "Unknown Author",
                                    keywords: article.keywords || [],
                                    content: article.content || "",
                                    excerpt: article.excerpt || "",
                                    image: article.image || "",
                                    images: article.images || [],
                                    readTime: article.readTime || 5,
                                    draft: article.draft || false,
                                    views: article.views || 0,
                                    createdAt: article.createdAt,
                                    updatedAt: article.updatedAt,
                                    categories: article.categories || [],
                                  }}
                                />
                                <JournalDownloadButton
                                  article={{
                                    title: article.title,
                                    slug: article.slug,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <div className="flex flex-wrap">
                                  {/* Handle both new Author structure and old authors structure */}
                                  {article.Author ? (
                                    <Link
                                      href={`/authors/${article.Author.slug || article.Author.email}`}
                                      className="hover:underline hover:text-primary transition-colors"
                                    >
                                      {article.Author.name}
                                    </Link>
                                  ) : article.authors && article.authors.length > 0 ? (
                                    article.authors.map((authorRel, i) => (
                                      <span key={authorRel.authorId}>
                                        <Link
                                          href={`/authors/${authorRel.author?.slug}`}
                                          className="hover:underline hover:text-primary transition-colors"
                                        >
                                          {authorRel.author?.name || "Unknown Author"}
                                        </Link>
                                        {i < article.authors.length - 1 && <span>, </span>}
                                      </span>
                                    ))
                                  ) : (
                                    <span>Unknown Author</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(article.date || article.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{article.readTime || Math.ceil((article.content?.length || 0) / 1000)} min read</span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">{article.excerpt}</p>

                            {/* Display a preview of content with images if available */}
                            {article.images && article.images.length > 0 && (
                              <div className="mt-4">
                                <details className="group">
                                  <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                                    Preview content with images
                                  </summary>
                                  <div className="mt-3 p-4 border rounded-lg bg-muted/50">
                                    <ArticleContentProcessor
                                      content={article.content?.substring(0, 500) + "..." || "No content available"}
                                      images={article.images}
                                      className="text-sm"
                                    />
                                  </div>
                                </details>
                              </div>
                            )}

                            {/* Display keywords with amber styling */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {article.keywords?.map((keyword, idx) => (
                                <Badge key={idx} className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                                  {keyword}
                                </Badge>
                              ))}
                              {/* For backward compatibility, also display categories if keywords aren't available */}
                              {(!article.keywords || article.keywords.length === 0) &&
                                article.categories?.map((categoryRel) => (
                                  <Badge
                                    key={categoryRel.categoryId}
                                    className="bg-amber-500 hover:bg-amber-600 text-white border-0"
                                  >
                                    {categoryRel.category?.name || "Uncategorized"}
                                  </Badge>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No articles found in this issue.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Journals</h1>
      <p>This is the journals page.</p>
    </div>
  )
}