import type { Metadata } from "next"
import { DecorativeHeading } from "@/components/decorative-heading"
import { SearchResults } from "@/components/search/search-results"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { constructMetadata } from "@/lib/metadata"

interface SearchPageProps {
  searchParams: {
    q?: string
    filter?: string
  }
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const query = searchParams.q || ""
  return constructMetadata({
    title: `Search Results for "${query}" | Open Journal of Law & Policy`,
    description: `Search results for "${query}" in the Open Journal of Law & Policy database.`,
    pathname: `/search?q=${encodeURIComponent(query)}`,
  })
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""
  const filter = searchParams.filter || "all"

  return (
    <div className="container px-4 py-8 md:py-12">
      <div className="mb-8 animate-fade-in">
        <DecorativeHeading level={1}>Search Results</DecorativeHeading>
        {query ? (
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Showing results for <span className="font-medium text-foreground">"{query}"</span>
          </p>
        ) : (
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Enter a search term to find articles, blogs, and authors
          </p>
        )}
      </div>

      {query ? (
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue={filter} className="mb-8">
            <TabsList className="grid grid-cols-4 max-w-md mx-auto">
              <TabsTrigger value="all" asChild>
                <a href={`/search?q=${encodeURIComponent(query)}&filter=all`}>All</a>
              </TabsTrigger>
              <TabsTrigger value="journals" asChild>
                <a href={`/search?q=${encodeURIComponent(query)}&filter=journals`}>Journals</a>
              </TabsTrigger>
              <TabsTrigger value="blogs" asChild>
                <a href={`/search?q=${encodeURIComponent(query)}&filter=blogs`}>Blogs</a>
              </TabsTrigger>
              <TabsTrigger value="authors" asChild>
                <a href={`/search?q=${encodeURIComponent(query)}&filter=authors`}>Authors</a>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <SearchResults query={query} filter="all" />
            </TabsContent>

            <TabsContent value="journals" className="mt-6">
              <SearchResults query={query} filter="journals" />
            </TabsContent>

            <TabsContent value="blogs" className="mt-6">
              <SearchResults query={query} filter="blogs" />
            </TabsContent>

            <TabsContent value="authors" className="mt-6">
              <SearchResults query={query} filter="authors" />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please enter a search term to see results</p>
        </div>
      )}
    </div>
  )
}
