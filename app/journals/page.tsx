// app/journals/page.tsx - UPDATED to use ArticleCard component
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { ArticleCard } from "@/components/article-card"
import { getLatestIssue } from "@/lib/controllers/journal-issues"
import { getArticlesByJournalIssue } from "@/lib/controllers/articles"
import { redirect } from "next/navigation"

export const revalidate = 3600 // Revalidate every hour

export default async function JournalsPage({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams.view

  // If view is call-for-papers, render the call for papers content
  if (view === "call-for-papers") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Call for Papers</h1>
        <p>This is the call for papers page.</p>
      </div>
    )
  }

  // Otherwise, render the regular journals content or redirect to archive
  if (view === "archive") {
    redirect("/journals/archive")
  }

  // Default journals content
  if (!view || view === "") {
    const latestIssue = await getLatestIssue()

    if (!latestIssue) {
      return (
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            <div className="container px-4 py-10 md:px-6">
              <div className="mb-8 animate-slide-up">
                <DecorativeHeading level={1}>Journal</DecorativeHeading>
                <div className="flex items-center justify-center w-full max-w-4xl mx-auto">
                  {/* Left decorative line */}
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300"></div>
                  
                  {/* Volume/Issue Info */}
                  <div className="flex gap-2 px-8 font-medium">
                    No Issues Available
                  </div>
                  
                  {/* Right decorative line */}
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )
    }

    const latestIssueArticles = await getArticlesByJournalIssue(latestIssue.id)

    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">

        <div className="max-w-5xl mx-auto text-center mt-4">
          {/* Header with download button */}
          <div className="mb-8 space-y-2 pt-10 relative">
            <h1 className="text-4xl md:text-5xl text-center text-stone-800">VOLUME {latestIssue.volume}</h1>
            <div className="text-stone-600 text-xs md:text-sm font-normal justify-center align-middle content-center text-center max-w-4xl mx-auto">
              <span>
                ISSUE {latestIssue.issue}
              </span>
              <span>
                {" • "}  
              </span>
              <span>
                {latestIssue.year}
              </span>
            </div>
              {/* Theme/Title */}
              {latestIssue.theme && (
                <div className="text-center">
                  <h2 className="text-xl font-medium text-muted-foreground">
                    {latestIssue.theme}
                  </h2>
                </div>
              )}
            </div>

            <div className="space-y-8">
              {/* Articles using ArticleCard component */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 text-left"> {latestIssueArticles.length > 0 ? (
                  latestIssueArticles.map((article, index) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No articles found in this issue.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Journals</h1>
      <p>This is the journals page.</p>
    </div>
  )
}