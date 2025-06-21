import { Navigation } from "@/components/navigation"
import { ArticleCard } from "@/components/article-card"
import { articles } from "@/lib/data"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Scale, Calendar, Clock } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BlogsPage() {
  const blogs = articles.filter((article) => article.type === "blog")
  
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-10 md:px-6">
          <div className="mb-8 animate-slide-up">
            <DecorativeHeading level={1}>Blogs</DecorativeHeading>
          </div>

          <div className="space-y-8">
            {/* Responsive grid: 1 column on mobile, 2 on lg, 3 on xl+ */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {blogs.map((article, index) => (
                <ScrollReveal key={article.slug} delay={index * 100}>
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-0 duration-300">
                    <CardHeader className="flex-shrink-0 pb-4">
                      <div className="flex justify-between items-start flex-row">
                        <Link href={`/blogs/${article.slug}`} className="hover:underline">
                          <CardTitle className="text-lg text-red-800 leading-tight line-clamp-3">
                            {article.title}
                          </CardTitle>
                        </Link>
                      </div>
                      
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-3">
                        {/* Authors */}
                        <div className="flex gap-1 text-red-800">
                          {article.authors && article.authors.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {article.authors.map((author, i) => (
                                <span key={author.slug}>
                                  <Link
                                    href={`/authors/${author.slug}`}
                                    className="hover:underline hover:text-primary transition-colors font-medium"
                                  >
                                    {author.name}
                                  </Link>
                                  {i < article.authors.length - 1 && <span>{` • `}</span>}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <Link
                              href={`/authors/${article.authorSlug}`}
                              className="hover:underline hover:text-primary transition-colors font-medium"
                            >
                              {article.author}
                            </Link>
                          )}
                        </div>

                        {/* Keywords/Categories */}
                        <div className="flex flex-wrap gap-1 text-xs">
                          {article.keywords?.map((keyword, i) => (
                            <span key={keyword} className="text-black">
                              {keyword}
                              {i < ((article.keywords?.length ?? 0) - 1) && <span>{` • `}</span>}
                            </span>
                          ))}
                          {/* For backward compatibility, also display categories if keywords aren't available */}
                          {!article.keywords?.length &&
                            article.categories?.map((category, i) => (
                              <span key={category} className="text-black">
                                {category}
                                {i < ((article.categories?.length ?? 0) - 1) && <span>{` • `}</span>}
                              </span>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-grow h-fit">
                      <p className="text-sm">
                        <span className="text-muted-foreground text-sm">{article.date}</span> • {article.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}