// app/journals/[slug]/page.tsx - Updated with Google Doc PDF download
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Clock, FileText, Tag, User, Users, Download } from "lucide-react"
import { getArticleBySlug, getRelatedArticles } from "@/lib/controllers/articles"
import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { JournalCitation } from "@/components/journal-citation"
import { JournalMetricsButton } from "@/components/journal-metrics-button"
import { DownloadButton } from "@/components/download-button"

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

  // Get related articles based on keywords and authors
  const authorIds = article.authors?.map(a => a.author.id) || []
  const relatedArticles = await getRelatedArticles(
    article.id,
    article.keywords,
    authorIds,
    3
  )

  // Extract authors using the junction table structure
  const authors = article.authors || []
  const primaryAuthor = authors.length > 0 ? authors[0]?.author : null

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <article className=" container max-w-5xl px-4 py-8 md:px-6">
          <div className="mb-6 space-y-4">
            <div>
            <h1 className="text-3xl sm:text-5xl text-stone-800 font-bold">
  {article.title.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
</h1>
            </div>

            <div className="space-y-3 text-sm text-center content-center justify-center">

              {/* Publication Info */}
              {/* <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600"> */}
                
                {/* {article.readTime && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{article.readTime} min read</span>
                  </div>
                )} */}

              {/* </div> */}

              {article.JournalIssue && (
                <div className="">
                  <span className=" text-stone-700 uppercase items-center text-center">
                    Volume {article.JournalIssue.volume}  •  Issue {article.JournalIssue.issue}  •  {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                  </span>
                </div>
              )}

              {/* Authors */}
              <div className=" items-center text-center gap-2 mb-3">
                { authors && authors.length > 0 && (
                  <div className="flex w-full flex-wrap gap-1 items-center text-center justify-center ">
                    {authors.map((authorArticle, i) => (
                      <span key={authorArticle.author.id}>
                        <Link
                          href={`/authors/${authorArticle.author.slug}`}
                          className="hover:underline hover:decoration-red-800  text-stone-700"
                        >
                          {authorArticle.author.name.toLocaleUpperCase()}
                        </Link>
                        {i < authors.length - 1 && <span className="text-stone-600"> • </span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="relative w-full mb-8 animate-fade-in">
            <div className="flex items-center justify-center w-full">
              {/* Left decorative line */}
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300"></div>
              
              {/* Buttons container */}
              <div className="flex gap-2 px-8">
                <JournalMetricsButton
                  article={{
                    title: article.title,
                    slug: article.slug,
                  }}
                />
                <JournalCitation
                  article={{
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    publishedAt: article.publishedAt, // Use publishedAt instead of date
                    volume: article.JournalIssue?.volume,
                    issue: article.JournalIssue?.issue,
                    year: article.JournalIssue?.year,
                    JournalIssue: article.JournalIssue,
                    // Pass the correct authors structure that matches our new interface
                    authors: authors.map(authorArticle => ({
                      author: {
                        id: authorArticle.author.id,
                        name: authorArticle.author.name,
                        slug: authorArticle.author.slug,
                      }
                    })),
                    // Keep legacy author field for backward compatibility
                    author: primaryAuthor?.name || "Unknown Author",
                    keywords: article.keywords || [],
                    content: article.content || "",
                    abstract: article.abstract || "",
                    image: article.image || "",
                    readTime: article.readTime || 5,
                    archived: article.archived || false,
                    views: article.views || 0,
                    createdAt: article.createdAt,
                    updatedAt: article.updatedAt,
                  }}
                />
                {/* Download Button - Updated to use Google Doc download */}
                {article.contentLink && (
                  <DownloadButton
                    contentLink={article.contentLink}
                    filename={`${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`}
                    title={article.title}
                  />
                )}
              </div>
              
              {/* Right decorative line */}
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300"></div>
            </div>
          </div>

          {/* Article Content */}
          {article.abstract && (
            <div className=" mb-4" style={{ animationDelay: "0.3s" }}>
              <div className="text-base text-stone-700 leading-relaxed space-y-4">
                {article.abstract.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Full Content */}
          {article.content && article.type !== "journal" && (
            <div className="prose prose-lg max-w-none mb-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="text-base text-stone-700 leading-relaxed space-y-4">
                {article.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {article.keywords && article.keywords.length > 0 && (
            <div className="flex flex-wrap items-center text-center text-sm mb-8">
              <div className="flex flex-wrap">
              {/* <span className="text-stone-700 font-bold ">TOPICS</span> */}
                {article.keywords.map((keyword, index) => (
                  <span key={keyword} className="flex flex-row text-center gap-2 ">
                    <span className="uppercase text-stone-600 ">
                      {keyword}
                    </span>
                    { index < article.keywords.length - 1 && <span className="text-stone-500 pr-2">{` • `}</span> }
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className=" pt-8 border-t border-stone-200 ">
              <ScrollReveal>
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-stone-800">RELATED ARTICLES</h2>
                  <div className={`${relatedArticles.length === 1 ? 'max-w-3xl mx-auto' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-2'}`}>
                    {relatedArticles.map((relatedArticle, index) => (
                      <ArticleCard
                        key={relatedArticle.id}
                        article={relatedArticle}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          )}
        </article>
      </main>
    </div>
  )
}