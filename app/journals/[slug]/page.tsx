// app/journals/[slug]/page.tsx - UPDATED for multiple authors with JournalPage1 styling
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
    // categoryId: article.categories[0]?.categoryId,
  })

  // Filter out the current article
  const filteredRelatedArticles = relatedArticles.filter((a) => a.id !== article.id)

  // Extract authors - prioritize the new authors array structure
  const authors = article.authors || []
  const primaryAuthor = authors.length > 0 ? authors[0]?.author : null

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <article className="container max-w-6xl px-4 py-8 md:px-6">
          <div className="mb-8 space-y-4 animate-slide-up">
            <div className="flex items-center justify-end">
            </div>
            <h1 className="text-4xl lg:text-5xl text-primary font-bold">
              {article.title}
            </h1>
            <div className="space-y-2">
              {/* First line: Authors */}
              <div className="flex flex-wrap items-center gap-4 text-base text-muted-foreground">
                <div className="flex items-center gap-1">
                  {authors && authors.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {authors.map((authorArticle, i) => (
                        <span key={authorArticle.author.id}>
                          <Link
                            href={`/authors/${authorArticle.author.slug || authorArticle.author.email}`}
                            className="hover:underline hover:text-primary font-medium transition-colors text-primary"
                          >
                            {authorArticle.author.name}
                          </Link>
                          {i < authors.length - 1 && <span> • </span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-red-500">No Author Found</span>
                  )}
                </div>
              </div>

              {/* Third Line: Keywords */}
              {article.keywords && article.keywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 text-base text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {article.keywords.map((keyword, index) => (
                        <span key={index} className="text-muted-foreground hover:text-primary transition-colors">
                          {keyword}
                          {index < article.keywords.length - 1 && " •"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decorative section with buttons and lines */}
          <div className="relative w-full mb-8 rounded-lg overflow-hidden ornamental-corners animate-fade-in">
            <div className="flex items-center justify-center w-full max-w-4xl mx-auto">
              {/* Left decorative line */}
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300"></div>
              
              {/* Buttons container */}
              <div className="flex gap-2 px-8">
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
                    volume: article.JournalIssue?.volume || 1,
                    issue: article.JournalIssue?.issue || 1,
                    year: article.JournalIssue?.year || new Date().getFullYear(),
                    // UPDATED: Use the new authors array structure
                    authors: authors.map(authorArticle => ({
                      id: authorArticle.author.id,
                      name: authorArticle.author.name,
                      slug: authorArticle.author.slug || authorArticle.author.email,
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
                    // categories: article.categories || [],
                  }}
                />
                <JournalDownloadButton
                  article={{
                    title: article.title,
                    slug: article.slug,
                  }}
                />
              </div>
              
              {/* Right decorative line */}
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300"></div>
            </div>
          </div>

          {/* Article Excerpt with Custom Styling */}
          {article.excerpt && (
            <div
              className="flex flex-col max-w-none items-center animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="mb-8 p-6 bg-muted/50 rounded-lg border-l-4 border-primary max-w-4xl">
                <p className="text-lg italic text-muted-foreground leading-relaxed text-justify">
                  {article.excerpt}
                </p>
              </div>
            </div>
          )}

          <div className="decorative-divider my-12"></div>

          {/* Related Articles */}
          {filteredRelatedArticles.length > 0 && (
            <ScrollReveal>
              <div className="space-y-4">
                <DecorativeHeading>Related Journals</DecorativeHeading>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                  {filteredRelatedArticles.slice(0, 3).map((relatedArticle, index) => {
                    // Extract authors for related articles
                    const relatedAuthors = relatedArticle.authors || []
                    const relatedPrimaryAuthor = relatedAuthors.length > 0 ? relatedAuthors[0]?.author : null

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
                          // UPDATED: Use the primary author from authors array
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