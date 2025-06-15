import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Clock, User } from "lucide-react"
import { Fragment } from "react"
import type { Metadata } from "next"
import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { constructMetadata } from "@/lib/metadata"
import { getArticleBySlug, getArticles } from "@/lib/controllers/articles"

interface BlogPageProps {
  params: {
    slug: string
  }
}

export const revalidate = 3600 // Revalidate every hour

// Generate metadata for the blog page
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug)

  if (!article) {
    return constructMetadata({
      title: "Blog Not Found",
      description: "The requested blog post could not be found.",
      noIndex: true,
    })
  }

  return constructMetadata({
    title: article.title,
    description: article.excerpt || `Read ${article.title} by ${article.authors[0]?.author?.name || "Unknown Author"}`,
    image: article.image || undefined,
    pathname: `/blogs/${params.slug}`,
  })
}

export default async function BlogPage({ params }: BlogPageProps) {
  const article = await getArticleBySlug(params.slug)

  if (!article || article.type !== "blog") {
    notFound()
  }

  // Get related articles
  const relatedArticles = await getArticles({
    type: "blog",
    limit: 3,
    categoryId: article.categories[0]?.categoryId, // Get articles from the same category if possible
  })

  // Filter out the current article
  const filteredRelatedArticles = relatedArticles.filter((a) => a.id !== article.id)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <article className="container max-w-3xl px-4 py-12 md:px-6">
          <div className="mb-8 space-y-4 animate-slide-up">
            <Link
              href="/blogs"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
            >
              ← Back to Blogs
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-serif">
              {article.title}
            </h1>
            <div className="space-y-2 text-sm text-muted-foreground">
              {/* First row: date and read time */}
              <div className="flex flex-wrap items-center gap-4">
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
              </div>

              {/* Second row: authors */}
              <div className="flex flex-wrap items-center gap-1">
                <User className="h-4 w-4" />
                <div className="flex flex-wrap">
                  {article.authors.map((authorRel, i) => (
                    <span key={authorRel.authorId}>
                      {authorRel.author?.slug ? (
                        <Link
                          href={`/authors/${authorRel.author.slug}`}
                          className="hover:underline hover:text-primary transition-colors"
                        >
                          {authorRel.author.name || "Unknown Author"}
                        </Link>
                      ) : (
                        <span>{authorRel.author?.name || "Unknown Author"}</span>
                      )}
                      {i < article.authors.length - 1 && <span>, </span>}
                    </span>
                  ))}
                </div>
              </div>
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

          <div
            className="prose prose-slate max-w-none dark:prose-invert animate-fade-in md:-mx-8 lg:-mx-16 mx-auto"
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
                <p key={index} className={index === 0 ? "drop-cap text-justify" : "text-justify"}>
                  {paragraph}
                </p>
              )
            })}
          </div>

          <div className="decorative-divider my-12"></div>

          <ScrollReveal>
            <div className="space-y-4">
              <DecorativeHeading>Related Blogs</DecorativeHeading>
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
