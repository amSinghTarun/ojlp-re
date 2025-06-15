import Link from "next/link"
import { notFound } from "next/navigation"
import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { AuthorProfile } from "@/components/author-profile"
import { getAuthorBySlug } from "@/lib/controllers/authors"
import { getArticlesByAuthor } from "@/lib/controllers/articles"

interface AuthorPageProps {
  params: {
    slug: string
  }
}

export const revalidate = 3600 // Revalidate every hour

export default async function AuthorPage({ params }: AuthorPageProps) {
  const author = await getAuthorBySlug(params.slug)

  if (!author) {
    notFound()
  }

  // Get articles by this author
  const authorArticles = await getArticlesByAuthor(author.id)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8">
            <Link
              href="/authors"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center mb-4"
            >
              ← Back to Authors
            </Link>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-1">
                <AuthorProfile
                  author={{
                    id: author.id,
                    name: author.name,
                    slug: author.slug,
                    title: author.title || "",
                    bio: author.bio || "",
                    detailedBio: author.detailedBio || "",
                    image: author.image || "/professional-headshot.png",
                    expertise: author.expertise || [],
                    education: author.education || [],
                    achievements: author.achievements || [],
                    publications: author.publications || [],
                    location: author.location || "",
                    affiliation: author.affiliation || "",
                    website: author.website || "",
                    socialLinks: {
                      twitter: author.socialTwitter || "",
                      linkedin: author.socialLinkedin || "",
                      email: author.socialEmail || author.email,
                      orcid: author.socialOrcid || "",
                    },
                  }}
                  articleCount={authorArticles.length}
                />
              </div>

              <div className="md:col-span-2">
                <DecorativeHeading>Articles by {author.name}</DecorativeHeading>

                {authorArticles.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    {authorArticles.map((articleRel, index) => {
                      const article = articleRel.article
                      return (
                        <ScrollReveal key={article.id} delay={index * 100}>
                          <ArticleCard
                            article={{
                              slug: article.slug,
                              title: article.title,
                              excerpt: article.excerpt || "",
                              image: article.image || "/placeholder.svg?height=600&width=800",
                              date: new Date(article.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }),
                              author: author.name,
                              authorSlug: author.slug,
                              type: article.type,
                              readTime: Math.ceil((article.content?.length || 0) / 1000),
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
