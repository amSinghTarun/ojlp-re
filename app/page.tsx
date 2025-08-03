import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import { ArticleCard } from "@/components/article-card"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { ArticleCarousel } from "@/components/article-carousel"
import { NotificationTicker } from "@/components/notification-ticker"
import { getLatestIssue } from "@/lib/controllers/journal-issues"
import { getHomePageData } from "@/lib/controllers/articles"
import { constructMetadata } from "@/lib/metadata"

export const metadata: Metadata = constructMetadata({
  title: "Open Journal of Law & Policy - Law and Constitution Blog",
  description: "Expert analysis and commentary on legal developments, constitutional law, and judicial decisions.",
  pathname: "/",
})

export const revalidate = 3600 // Revalidate every hour

export default async function Home() {
  // OPTIMIZED: Get all home page data in parallel
  const [latestIssue, homePageData] = await Promise.all([
    getLatestIssue(),
    getHomePageData()
  ])

  // Extract data from optimized response
  const { carouselArticles, recentArticles, featuredArticles } = homePageData

  // Debug logging (remove in production)
  console.log("Home page data:", {
    carouselCount: carouselArticles.length,
    recentCount: recentArticles.length,
    featuredCount: featuredArticles.length
  })

  // Create issue info string
  const issueInfo = latestIssue
    ? `Volume ${latestIssue.volume}, Issue ${latestIssue.issue} (${latestIssue.year}): ${latestIssue.theme}`
    : "Latest Issue"

  // Helper function to transform article data for components
  const transformArticleForCard = (article: any) => ({
    slug: article.slug,
    title: article.title,
    abstract: article.abstract || "",
    date: new Date(article.publishedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    author: article.authors?.[0]?.author?.name || "Unknown Author",
    authorSlug: article.authors?.[0]?.author?.slug || "",
    type: article.type,
    readTime: article.readTime || Math.ceil((article.content?.length || 0) / 1000),
    authors: article.authors?.map((authorRel: any) => ({
      name: authorRel.author?.name || "Unknown Author",
      slug: authorRel.author?.slug || "",
    })) || [],
  })

  // Transform carousel articles
  const transformedCarouselArticles = carouselArticles.map((article) => ({
    slug: article.slug,
    title: article.title,
    abstract: article.abstract || "",
    author: article.authors?.[0]?.author?.name || "Unknown Author",
    authorSlug: article.authors?.[0]?.author?.slug || "",
    type: article.type,
  }))

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Carousel Section */}
        <section className="w-full">
          <ArticleCarousel
            articles={transformedCarouselArticles}
            issueInfo={issueInfo}
          />
        </section>

        {/* Notification Ticker - Always show */}
        <NotificationTicker />

        <div className="container max-w-6xl">
          {/* Recent Content Section */}
          <section className="pb-12">
            <ScrollReveal threshold={0.2} delay={200}>
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-4xl sm:text-3xl">Recent</h1>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {recentArticles.map((article, index) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* Featured Content Section - Always show, even if empty */}
          <section className="pb-12">
            <ScrollReveal threshold={0.2} delay={300}>
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  {/* <DecorativeHeading>Featured Articles</DecorativeHeading> */}
                  <h1 className="text-4xl sm:text-3xl">Featured</h1>
                  {/* <Link href="/featured" className="text-primary hover:underline flex items-center group">
                    View All Featured
                    {/* <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /> */}
                  {/* </Link> */}
                </div>
                
                {featuredArticles.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 stagger-children">
                    {featuredArticles.map((article, index) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        index={index}
                        featured={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                    <p className="text-muted-foreground text-lg font-medium mb-2">
                      No Featured Articles Yet
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Featured articles will appear here when they are marked as featured by administrators.
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </div>
  )
}