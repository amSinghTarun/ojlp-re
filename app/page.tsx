import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { ArticleCarousel } from "@/components/article-carousel"
import { NotificationTicker } from "@/components/notification-ticker"
import { getLatestIssue } from "@/lib/controllers/journal-issues"
import { getArticles, getFeaturedArticles } from "@/lib/controllers/articles"
import { constructMetadata } from "@/lib/metadata"

export const metadata: Metadata = constructMetadata({
  title: "Open Journal of Law & Policy - Law and Constitution Blog",
  description: "Expert analysis and commentary on legal developments, constitutional law, and judicial decisions.",
  pathname: "/",
})

export const revalidate = 3600 // Revalidate every hour

export default async function Home() {
  // Get the latest journal issue
  const latestIssue = await getLatestIssue()

  // Get featured articles for the carousel
  const featuredArticles = await getFeaturedArticles(5)

  // Get recent articles
  const recentArticles = await getArticles({ limit: 6 })

  // Create issue info string
  const issueInfo = latestIssue
    ? `Volume ${latestIssue.volume}, Issue ${latestIssue.issue} (${latestIssue.year}): ${latestIssue.title}`
    : "Latest Issue"

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full">
          <ArticleCarousel
            articles={featuredArticles.map((article) => ({
              slug: article.slug,
              title: article.title,
              excerpt: article.excerpt || "",
              author: article.authors[0]?.author?.name || "Unknown Author",
              authorSlug: article.authors[0]?.author?.slug || "",
              type: article.type,
            }))}
            issueInfo={issueInfo}
          />
        </section>

        {/* <div className="z-30 text-center py-2 px-4 text-sm text-primary bg-muted font-medium">
          Latest Issue: {issueInfo}
        </div> */}

        <NotificationTicker />

        <section className="container px-4 pb-12 md:px-6">
          {/* Recent Content Section */}
          <ScrollReveal threshold={0.2} delay={200}>
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <DecorativeHeading>Recent </DecorativeHeading>
                {/* <div className="flex space-x-4">
                  <Link href="/journals" className="text-neutral-700 hover:underline flex items-center group">
                    All Journals
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link href="/blogs" className="text-primary hover:underline flex items-center group">
                    All Blogs
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div> */}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
                {recentArticles.map((article, index) => (
                  <ArticleCard
                    key={article.id}
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
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </div>
  )
}