import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { getArticles } from "@/lib/controllers/articles"

export const revalidate = 3600 // Revalidate every hour

export default async function BlogsPage() {
  const blogs = await getArticles({ type: "blog" })

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8 animate-slide-up">
            <DecorativeHeading level={1}>Blogs</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Explore our collection of blogs on contemporary legal issues and analysis.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((article, index) => (
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
                    author: article.authors[0]?.author?.name || "Unknown Author",
                    authorSlug: article.authors[0]?.author?.slug || "",
                    type: article.type,
                    readTime: Math.ceil((article.content?.length || 0) / 1000), // Rough estimate: 1000 chars = 1 min read
                  }}
                  index={index}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
