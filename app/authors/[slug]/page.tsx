import React from "react"
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
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <div className="max-w-5xl mx-auto text-center mt-4">
          {/* Header matching JournalsPage style */}
          <div className="mb-8 space-y-2 pt-10 relative">
            <h1 className="text-4xl md:text-5xl text-center text-stone-800">{author.name.toLocaleUpperCase()}</h1>
            <div className="text-sm md:text-base text-center text-stone-800">AUTHOR</div>
            
            {/* Author bio or description */}
            {author.bio && (
              <div className="text-center">
                <h2 className="text-xl font-medium text-muted-foreground max-w-3xl mx-auto">
                  {author.bio}
                </h2>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {/* Articles using ArticleCard component - matching JournalsPage grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 text-left">
              {authorArticlesResult.length > 0 ? (
                authorArticlesResult.map((article, index) => {
                  console.log("````````````````````````````----------.............")
                  
                  // Transform the data to match ArticleWithAuthors interface
                  const transformedArticle = {
                    id: article.id,
                    slug: article.slug,
                    title: article.title,
                    abstract: article.excerpt || article.abstract || null,
                    content: article.content || null,
                    type: article.type as "blog" | "journal",
                    publishedAt: new Date(article.date || article.createdAt),
                    readTime: article.readTime || Math.ceil((article.content?.length || 0) / 1000),
                    image: article.image || null,
                    views: article.views || undefined,
                    keywords: article.keywords || [],
                    featured: article.featured || false,
                    carousel: article.carousel || false,
                    archived: article.archived || false,
                    // Transform authors to match the AuthorArticle junction structure
                    authors: article.Authors && article.Authors.length > 0 
                      ? article.Authors.map((authorData: any, idx: number) => ({
                          id: `${article.id}-${authorData.id}`, // Generate junction ID
                          authorId: authorData.id,
                          articleId: article.id,
                          authorOrder: idx + 1,
                          author: {
                            id: authorData.id,
                            slug: authorData.slug,
                            name: authorData.name,
                            email: authorData.email,
                            title: authorData.title || null,
                            bio: authorData.bio || null,
                          }
                        }))
                      : [{
                          id: `${article.id}-${author.id}`,
                          authorId: author.id,
                          articleId: article.id,
                          authorOrder: 1,
                          author: {
                            id: author.id,
                            slug: author.slug,
                            name: author.name,
                            email: author.email,
                            title: author.title || null,
                            bio: author.bio || null,
                          }
                        }],
                    // Journal issue information (if applicable)
                    JournalIssue: article.JournalIssue || null,
                  }
                  
                  return (
                    <ArticleCard
                      key={article.id}
                      article={transformedArticle}
                      index={index}
                    />
                  )
                })
              ) : (
                <div className="text-center py-12 col-span-full">
                  <p className="text-muted-foreground">No articles found for this author.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}