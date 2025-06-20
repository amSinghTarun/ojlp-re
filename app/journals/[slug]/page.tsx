// app/journals/[slug]/page.tsx - UPDATED for multiple authors
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Clock, FileText, Tag, User, Users } from "lucide-react"
import { Fragment } from "react"
import { getArticleBySlug, getArticles } from "@/lib/controllers/articles"
import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { JournalDownloadButton } from "@/components/journal-download-button"
import { JournalCitation } from "@/components/journal-citation"
import { JournalMetricsButton } from "@/components/journal-metrics-button"
import { ArticleContentProcessor } from "@/components/article-content-processor"
import { Badge } from "@/components/ui/badge"

interface JournalPageProps {
  params: {
    slug: string
  }
}

export const revalidate = 3600 // Revalidate every hour

export default async function JournalPage({ params }: JournalPageProps) {
  const article = await getArticleBySlug(params.slug)

  if (!article || article.type !== "journal") {
    notFound()
  }

  // Get related articles
  const relatedArticles = await getArticles({
    type: "journal",
    limit: 3,
    categoryId: article.categories[0]?.categoryId,
  })

  // Filter out the current article
  const filteredRelatedArticles = relatedArticles.filter((a) => a.id !== article.id)

  // Extract authors - prioritize the new Authors array structure
  const authors = article.Authors || []
  const primaryAuthor = authors.length > 0 ? authors[0] : null

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <article className="container max-w-4xl px-4 py-12 md:px-6">
          <div className="mb-8 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <Link
                href="/journals"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
              >
                ← Back to Journals
              </Link>
              <div className="flex items-center gap-2">
                <JournalMetricsButton
                  article={{
                    title: article.title,
                    slug: article.slug,
                    doi: article.doi || "",
                  }}
                />
                <JournalCitation
                  article={{
                    title: article.title,
                    slug: article.slug,
                    date: article.date || article.createdAt,
                    doi: article.doi || "",
                    volume: article.journalIssue?.volume || 1,
                    issue: article.journalIssue?.issue || 1,
                    year: article.journalIssue?.year || new Date().getFullYear(),
                    // UPDATED: Use the new Authors array structure
                    authors: authors.map(author => ({
                      id: author.id,
                      name: author.name,
                      slug: author.slug || author.email,
                    })),
                    author: primaryAuthor?.name || "Unknown Author",
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

            {/* Article Header */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                {article.title}
              </h1>
              
              {/* Article Meta */}
              <div className="space-y-2">
                
                {/* First line: date, read time, DOI */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                  {article.doi && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>
                        DOI:{" "}
                        <a
                          href={`https://doi.org/${article.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-primary"
                        >
                          {article.doi}
                        </a>
                      </span>
                    </div>
                  )}
                </div>

                {/* Second line: authors - UPDATED for multiple authors */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {authors.length > 1 ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <div className="flex flex-wrap">
                      {authors.length > 0 ? (
                        authors.map((author, i) => (
                          <span key={author.id}>
                            <Link
                              href={`/authors/${author.slug || author.email}`}
                              className="hover:underline hover:text-primary transition-colors"
                            >
                              {author.name}
                            </Link>
                            {i < authors.length - 1 && <span>, </span>}
                          </span>
                        ))
                      ) : (
                        <span className="text-red-500">No Author Found</span>
                      )}
                    </div>
                    {authors.length > 1 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {authors.length} authors
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Third line: author details for multiple authors */}
                {authors.length > 1 && (
                  <div className="mt-3 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Authors:</h4>
                    <div className="space-y-1">
                      {authors.map((author, index) => (
                        <div key={author.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <Link
                            href={`/authors/${author.slug || author.email}`}
                            className="font-medium hover:underline hover:text-primary transition-colors"
                          >
                            {author.name}
                          </Link>
                          {author.email && (
                            <span className="text-muted-foreground">({author.email})</span>
                          )}
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              First Author
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {article.keywords && article.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {article.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Article Content with Image Processing */}
          <div className="mb-12 animate-slide-up">
            {/* Excerpt */}
            {article.excerpt && (
              <div className="mb-8 p-6 bg-muted/50 rounded-lg border-l-4 border-primary">
                <p className="text-lg italic text-muted-foreground">{article.excerpt}</p>
              </div>
            )}

            {/* Main Content with Image Processing */}
            {article.content && (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ArticleContentProcessor
                  content={article.content}
                  images={article.images || []}
                  className="text-lg leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Categories */}
          {article.categories && article.categories.length > 0 && (
            <div className="mb-8 animate-slide-up">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {article.categories.map((categoryRel) => (
                  <Badge key={categoryRel.categoryId} variant="outline">
                    {categoryRel.category?.name || "Uncategorized"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {filteredRelatedArticles.length > 0 && (
            <ScrollReveal className="border-t pt-12">
              <div className="mb-8">
                <DecorativeHeading>Related Articles</DecorativeHeading>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRelatedArticles.slice(0, 3).map((relatedArticle, index) => {
                    // Extract authors for related articles
                    const relatedAuthors = relatedArticle.Authors || []
                    const relatedPrimaryAuthor = relatedAuthors.length > 0 ? relatedAuthors[0] : null

                    return (
                      <ArticleCard
                        key={relatedArticle.id}
                        article={{
                          slug: relatedArticle.slug,
                          title: relatedArticle.title,
                          excerpt: relatedArticle.excerpt || "",
                          image: relatedArticle.image || "/placeholder.svg?height=600&width=800",
                          date: new Date(relatedArticle.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }),
                          // UPDATED: Use the primary author from Authors array
                          author: relatedPrimaryAuthor?.name || "Unknown Author",
                          authorSlug: relatedPrimaryAuthor?.slug || relatedPrimaryAuthor?.email || "",
                          type: relatedArticle.type,
                          readTime: Math.ceil((relatedArticle.content?.length || 0) / 1000),
                        }}
                        index={index}
                      />
                    )
                  })}
                </div>
              </div>
            </ScrollReveal>
          )}
        </article>
      </main>
    </div>
  )
}