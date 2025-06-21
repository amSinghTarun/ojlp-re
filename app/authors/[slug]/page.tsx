// app/authors/[slug]/page.tsx - FIXED to use database and handle Next.js 15
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { AuthorProfile } from "@/components/author-profile"
import { getAuthorBySlug } from "@/lib/controllers/authors"
import { getArticlesByAuthor } from "@/lib/controllers/articles"

interface AuthorPageProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 3600 // Revalidate every hour

export default async function AuthorPage({ params }: AuthorPageProps) {
  // UPDATED: Await params for Next.js 15
  const resolvedParams = await params

  // UPDATED: Fetch author from database instead of static data
  const author = await getAuthorBySlug(decodeURIComponent(resolvedParams.slug))
  console.log(author)
  if (!author) {
    notFound()
  }

  // UPDATED: Get articles by this author from database
  const authorArticlesResult = await getArticlesByAuthor(author.id)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8">

            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-2">
                <DecorativeHeading>Articles by {author.name}</DecorativeHeading>

                {authorArticlesResult.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    {authorArticlesResult.map((article, index) => {
                      console.log("````````````````````````````----------.............")
                      // console.log(articleRel)
                      // const article = articleRel.article
                      
                      // UPDATED: Handle multiple authors properly
                      const authors = article.Authors || []
                      const articleAuthors = authors.length > 0 ? authors : [author]
                      
                      return (
                        <ScrollReveal key={article.id} delay={index * 100}>
                          <ArticleCard
                            article={{
                              slug: article.slug,
                              title: article.title,
                              excerpt: article.excerpt || "",
                              image: article.image || "/placeholder.svg?height=600&width=800",
                              date: new Date(article.date || article.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }),
                              // UPDATED: Support multiple authors
                              authors: articleAuthors,
                              // Legacy support for components that still expect these
                              author: author.name,
                              authorSlug: author.slug,
                              type: article.type,
                              readTime: article.readTime || Math.ceil((article.content?.length || 0) / 1000),
                              keywords: article.keywords || [],
                            }}
                            index={index}
                          />
                        </ScrollReveal>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No articles found for this author.</p>
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