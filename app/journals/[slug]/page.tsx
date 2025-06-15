import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Clock, FileText, Tag, User } from "lucide-react"
import { Fragment } from "react"
import { getArticleBySlug, getArticles } from "@/lib/controllers/articles"
import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { JournalDownloadButton } from "@/components/journal-download-button"
import { JournalCitation } from "@/components/journal-citation"
import { JournalMetricsButton } from "@/components/journal-metrics-button"

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
    categoryId: article.categories[0]?.categoryId, // Get articles from the same category if possible
  })

  // Filter out the current article
  const filteredRelatedArticles = relatedArticles.filter((a) => a.id !== article.id)

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
                    doi: article.doi || "",
                    volume: article.journalIssue?.volume || 0,
                    issue: article.journalIssue?.issue || 0,
                    year: article.journalIssue?.year || new Date().getFullYear(),
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              {article.title}
            </h1>
            <div className="space-y-2">
              {/* First line: date, read time, DOI */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(article.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{Math.ceil((article.content?.length || 0) / 1000)} min read</span>
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

              {/* Second line: authors */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <div className="flex flex-wrap">
                    {article.authors.map((authorRel, i) => (
                      <span key={authorRel.authorId}>
                        <Link
                          href={`/authors/${authorRel.author?.slug}`}
                          className="hover:underline hover:text-primary transition-colors"
                        >
                          {authorRel.author?.name || "Unknown Author"}
                        </Link>
                        {i < article.authors.length - 1 && <span>, </span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {article.keywords && article.keywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <div className="flex flex-wrap gap-2">
                      {article.keywords.map((keyword, index) => (
                        <span key={index} className="text-muted-foreground hover:text-primary transition-colors">
                          {keyword}
                          {index < article.keywords.length - 1 && ","}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] mb-8 rounded-lg overflow-hidden ornamental-corners animate-fade-in">
            <Image
              src={article.image || "/placeholder.svg?height=600&width=800"}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Find the prose div that contains the article content */}
          <div
            className="max-w-none dark:prose-invert animate-fade-in mx-auto md:-mx-8 lg:-mx-16"
            style={{ animationDelay: "0.3s", maxWidth: "calc(100% + 8rem)" }}
          >
            {article.content.split("\n\n").map((paragraph, index) => {
              // Check if the paragraph contains an image tag
              if (paragraph.includes("<img")) {
                // This is a simple approach - in a real app you might want to use a proper HTML parser
                return (
                  <Fragment key={index}>
                    <div dangerouslySetInnerHTML={{ __html: paragraph }} className="my-8" />
                  </Fragment>
                )
              }

              return (
                <p key={index}>
                  {paragraph}
                </p>
              )
            })}
          </div>

          <div className="decorative-divider my-12"></div>

          <ScrollReveal>
            <div className="space-y-4">
              <DecorativeHeading>Related Journals</DecorativeHeading>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                {filteredRelatedArticles.map((relatedArticle, index) => (
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
                      author: relatedArticle.authors[0]?.author?.name || "Unknown Author",
                      authorSlug: relatedArticle.authors[0]?.author?.slug || "",
                      type: relatedArticle.type,
                      readTime: Math.ceil((relatedArticle.content?.length || 0) / 1000),
                    }}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </article>
      </main>
    </div>
  )
}
