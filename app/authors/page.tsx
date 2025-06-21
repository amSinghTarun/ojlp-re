import Link from "next/link"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAuthors } from "@/lib/controllers/authors"
import { getArticlesByAuthor } from "@/lib/controllers/articles"

export const revalidate = 3600 // Revalidate every hour

export default async function AuthorsPage() {
  const authors = await getAuthors()

  // Get article counts for each author
  const authorArticleCounts = await Promise.all(
    authors.map(async (author) => {
      const articles = await getArticlesByAuthor(author.id)
      return {
        authorId: author.id,
        count: articles.length,
      }
    }),
  )

  // Create a map for quick lookup
  const articleCountMap = new Map(authorArticleCounts.map((item) => [item.authorId, item.count]))

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8 animate-slide-up">
            <DecorativeHeading level={1}>Our Authors</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Meet the legal experts and scholars who contribute to LegalInsight.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((author, index) => {
              const authorArticleCount = articleCountMap.get(author.id) || 0

              return (
                <ScrollReveal key={author.id} delay={index * 100}>
                  <Card className="overflow-hidden law-card ornamental-corners animate-fade-in">
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image
                        src={author.image || "/placeholder.svg?height=400&width=600&query=professional headshot"}
                        alt={author.name}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <CardHeader className="p-4 border-b border-muted">
                      <div className="space-y-1">
                        <Link href={`/authors/${author.slug}`} className="hover:underline group">
                          <h3 className="font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors">
                            {author.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">{author.title}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                      <p className="text-muted-foreground line-clamp-3">{author.bio}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex flex-wrap items-center text-sm text-muted-foreground gap-4 border-t border-muted mt-2">
                      <div className="flex items-center gap-1">
                        <span>
                          {authorArticleCount} {authorArticleCount === 1 ? "Article" : "Articles"}
                        </span>
                      </div>
                      <Button asChild size="sm" variant="outline" className="ml-auto">
                        <Link href={`/authors/${author.slug}`}>View Profile</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
