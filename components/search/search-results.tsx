"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, User, FileText, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { articles } from "@/lib/data"
import { getAuthors } from "@/lib/authors"

interface SearchResultsProps {
  query: string
  filter?: string
  dialogMode?: boolean
}

export function SearchResults({ query, filter = "all", dialogMode = false }: SearchResultsProps) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authors, setAuthors] = useState<any[]>([])

  useEffect(() => {
    // Simulate loading
    setLoading(true)

    // Get authors data
    const authorsList = getAuthors()
    setAuthors(authorsList)

    // Only perform search if query has minimum length
    if (query.length > 1) {
      // Perform search
      const searchResults = performSearch(query, filter)

      // Simulate async search
      const timer = setTimeout(() => {
        setResults(searchResults)
        setLoading(false)
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setResults([])
      setLoading(false)
    }
  }, [query, filter])

  const performSearch = (searchQuery: string, filterType: string) => {
    const normalizedQuery = searchQuery.toLowerCase().trim()

    if (!normalizedQuery) return []

    let filteredResults: any[] = []

    // Search in articles (journals and blogs)
    if (filterType === "all" || filterType === "journals" || filterType === "blogs") {
      const filteredArticles = articles.filter((article) => {
        // Filter by type if needed
        if (filterType === "journals" && article.type !== "journal") return false
        if (filterType === "blogs" && article.type !== "blog") return false

        // Search in title
        const titleMatch = article.title.toLowerCase().includes(normalizedQuery)

        // Search in author
        const authorMatch = article.author.toLowerCase().includes(normalizedQuery)

        // Search in keywords
        const keywordsMatch =
          article.keywords?.some((keyword) => keyword.toLowerCase().includes(normalizedQuery)) || false

        // Search in categories (for backward compatibility)
        const categoriesMatch =
          article.categories?.some((category) => category.toLowerCase().includes(normalizedQuery)) || false

        // Search in content (with lower priority)
        const contentMatch = article.content.toLowerCase().includes(normalizedQuery)

        return titleMatch || authorMatch || keywordsMatch || categoriesMatch || contentMatch
      })

      // Add type property for rendering
      filteredResults = [
        ...filteredResults,
        ...filteredArticles.map((article) => ({
          ...article,
          resultType: article.type,
        })),
      ]
    }

    // Search in authors
    if (filterType === "all" || filterType === "authors") {
      const authorsList = getAuthors()
      const filteredAuthors = authorsList.filter((author) => {
        const nameMatch = author.name.toLowerCase().includes(normalizedQuery)
        const bioMatch = author.bio?.toLowerCase().includes(normalizedQuery) || false
        const expertiseMatch =
          author.expertise?.some((exp: string) => exp.toLowerCase().includes(normalizedQuery)) || false

        return nameMatch || bioMatch || expertiseMatch
      })

      // Add type property for rendering
      filteredResults = [
        ...filteredResults,
        ...filteredAuthors.map((author) => ({
          ...author,
          resultType: "author",
        })),
      ]
    }

    // Limit results in dialog mode
    if (dialogMode) {
      return filteredResults.slice(0, 5)
    }

    return filteredResults
  }

  if (loading) {
    return (
      <div className={`p-4 ${dialogMode ? "" : "min-h-[300px]"} flex items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center">
          <Search className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={`p-4 ${dialogMode ? "" : "min-h-[300px]"} flex items-center justify-center`}>
        <div className="flex flex-col items-center text-center">
          <Search className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No results found for "{query}"</p>
          <p className="text-sm text-muted-foreground mt-1">Try different keywords or filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className={dialogMode ? "p-2" : "space-y-6"}>
      {results.map((result, index) => (
        <div key={`${result.resultType}-${result.slug || result.id}-${index}`} className="mb-4">
          {result.resultType === "journal" || result.resultType === "blog" ? (
            <Card className={dialogMode ? "hover:bg-accent transition-colors" : ""}>
              <CardContent className={dialogMode ? "p-3" : "p-4"}>
                <div className="flex items-start gap-3">
                  {!dialogMode && (
                    <div className="hidden sm:block flex-shrink-0">
                      <div className="relative w-20 h-20 overflow-hidden rounded-md">
                        <Image
                          src={result.image || "/placeholder.svg?height=80&width=80"}
                          alt={result.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/${result.resultType === "journal" ? "journals" : "blogs"}/${result.slug}`}
                      className="hover:underline"
                    >
                      <h3 className={`font-semibold ${dialogMode ? "text-base" : "text-lg"}`}>{result.title}</h3>
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span className="capitalize">{result.resultType}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <Link
                          href={`/authors/${result.authorSlug}`}
                          className="hover:underline hover:text-primary transition-colors"
                        >
                          {result.author}
                        </Link>
                      </div>
                      {!dialogMode && (
                        <>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{result.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{result.readTime} min read</span>
                          </div>
                        </>
                      )}
                    </div>

                    {!dialogMode && <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{result.excerpt}</p>}

                    {!dialogMode && result.keywords && result.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {result.keywords.map((keyword: string) => (
                          <Badge key={keyword} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              {!dialogMode && (
                <CardFooter className="pt-0">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${result.resultType === "journal" ? "journals" : "blogs"}/${result.slug}`}>
                      Read {result.resultType === "journal" ? "Article" : "Blog"}
                    </Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          ) : (
            result.resultType === "author" && (
              <Card className={dialogMode ? "hover:bg-accent transition-colors" : ""}>
                <CardContent className={dialogMode ? "p-3" : "p-4"}>
                  <div className="flex items-center gap-3">
                    {!dialogMode && (
                      <div className="hidden sm:block flex-shrink-0">
                        <div className="relative w-12 h-12 overflow-hidden rounded-full">
                          <Image
                            src={result.image || "/placeholder.svg?height=48&width=48&query=person"}
                            alt={result.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <Link href={`/authors/${result.slug}`} className="hover:underline">
                        <h3 className={`font-semibold ${dialogMode ? "text-base" : "text-lg"}`}>{result.name}</h3>
                      </Link>

                      {result.title && <p className="text-sm text-muted-foreground">{result.title}</p>}

                      {!dialogMode && result.expertise && result.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.expertise.slice(0, 3).map((exp: string) => (
                            <Badge key={exp} variant="outline" className="text-xs">
                              {exp}
                            </Badge>
                          ))}
                          {result.expertise.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{result.expertise.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {!dialogMode && result.bio && (
                        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{result.bio}</p>
                      )}
                    </div>
                  </div>
                </CardContent>

                {!dialogMode && (
                  <CardFooter className="pt-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/authors/${result.slug}`}>View Profile</Link>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          )}
        </div>
      ))}

      {dialogMode && results.length > 4 && (
        <div className="text-center text-sm text-muted-foreground p-2">
          <p>Showing top 5 results. Search to see more.</p>
        </div>
      )}
    </div>
  )
}
