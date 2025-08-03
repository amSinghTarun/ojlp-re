//article-card.tsx

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

// Updated interface to match the controller output structure
interface ArticleWithAuthors {
  id: string
  slug: string
  title: string
  abstract?: string | null
  content?: string | null
  type: "blog" | "journal"
  publishedAt: Date
  readTime?: number | null
  image?: string | null
  views?: number
  keywords?: string[]
  featured?: boolean
  carousel?: boolean
  archived?: boolean
  // AuthorArticle junction table structure from controller
  authors?: {
    id: string
    authorId: string
    articleId: string
    authorOrder: number
    author: {
      id: string
      slug: string
      name: string
      email: string
      title?: string | null
      bio?: string | null
    }
  }[]
  // Journal issue information
  JournalIssue?: {
    id: string
    volume: number
    issue: number
    year: number
    theme?: string | null
  } | null
}

interface ArticleCardProps {
  article: ArticleWithAuthors
  index?: number
  featured?: boolean
}

export function ArticleCard({ article, index = 0, featured = false }: ArticleCardProps) {
  console.log(article)
  
  // Helper function to render individual authors with separators
  const renderAuthors = () => {
    if (!article.authors || article.authors.length === 0) {
      return <span>UNKNOWN AUTHOR</span>
    }
    
    console.log(article.authors)

    // Sort by authorOrder
    const sortedAuthors = article.authors
      .sort((a, b) => a.authorOrder - b.authorOrder)
    
    if (sortedAuthors.length === 1) {
      const author = sortedAuthors[0].author
      return (
        <Link
          href={`/authors/${author.slug}`}
          className="hover:underline transition-colors"
        >
          {author.name.toLocaleUpperCase()}
        </Link>
      )
    } else if (sortedAuthors.length <= 3) {
      return (
        <span>
          {sortedAuthors.map((authorRel, index) => {
            const author = authorRel.author
            const isLast = index === sortedAuthors.length - 1
            const isSecondToLast = index === sortedAuthors.length - 2
            
            return (
              <span key={author.id}>
                <Link
                  href={`/authors/${author.slug}`}
                  className="hover:underline transition-colors"
                >
                  {author.name.toLocaleUpperCase()}
                </Link>
                {!isLast && (
                  <span className="mx-1 text-stone-400">
                    {isSecondToLast && sortedAuthors.length > 2 ? " & " : " • "}
                  </span>
                )}
              </span>
            )
          })}
        </span>
      )
    } else {
      // For more than 3 authors, show first author + "et al."
      const firstAuthor = sortedAuthors[0].author
      return (
        <span>
          <Link
            href={`/authors/${firstAuthor.slug}`}
            className="hover:underline transition-colors"
          >
            {firstAuthor.name.toLocaleUpperCase()}
          </Link>
          <span className="mx-1 text-stone-400">•</span>
          <span>ET AL.</span>
        </span>
      )
    }
  }

  return (
    <Card
      className={`border-0 border-b border-stone-400 h-full flex flex-col py-4`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardContent className="pt-5 flex-grow text-stone-900 p-2">
        <div className="space-y-3 text-sm ">
          {/* Article Type Badge and Featured Badge */}
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground pb-2 text-sm font-semibold text-red-900">
              {article.type === "journal" ? "ARTICLE" : "BLOG"}
            </div>
          </div>

          {/* Article Title */}
          <Link
            href={`/${article.type === "journal" ? "journals" : "blogs"}/${article.slug}`}
            className="hover:underline group font-medium text-red-900"
          >
            <h1 className="font-bold text-stone-800 text-2xl ">
              {article.title?.toLocaleUpperCase()}
            </h1>
          </Link>

          {/* Abstract */}
          <p className="text-base line-clamp-4">
            <h6 className="text-stone-900 font-normal">
              <span className="text-stone-600 font-medium">
                {article.publishedAt?.toLocaleDateString('en-US', { month: 'short', year: 'numeric'}).toLocaleUpperCase()}
              </span>
              {" • "}
              {article.abstract || article.content}
            </h6>
          </p>

          {/* Authors */}
          <div className="flex items-center gap-1.5 text-sm text-stone-500 font-medium">
            {renderAuthors()}
          </div>

          {/* {article.readTime && (
            <div className="flex items-center text-xs text-stone-600">
              <span>{article.readTime} min read</span>
            </div>
          )} */}

        </div>
      </CardContent>
    </Card>
  )
}

// Alternative compact version for lists - keeping same styling approach
export function ArticleCardCompact({ article, index = 0 }: ArticleCardProps) {
  // Helper function for compact author rendering
  const renderCompactAuthors = () => {
    if (!article.authors || article.authors.length === 0) {
      return <span>UNKNOWN AUTHOR</span>
    }
    
    const sortedAuthors = article.authors
      .sort((a, b) => a.authorOrder - b.authorOrder)
    
    if (sortedAuthors.length === 1) {
      const author = sortedAuthors[0].author
      return (
        <Link 
          href={`/authors/${author.slug}`}
          className="hover:underline transition-colors"
        >
          {author.name.toLocaleUpperCase()}
        </Link>
      )
    } else {
      // For compact view, show first author + "ET AL." if multiple
      const firstAuthor = sortedAuthors[0].author
      return (
        <span>
          <Link 
            href={`/authors/${firstAuthor.slug}`}
            className="hover:underline transition-colors"
          >
            {firstAuthor.name.toLocaleUpperCase()}
          </Link>
          <span className="mx-1 text-stone-400">•</span>
          <span>ET AL.</span>
        </span>
      )
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/30 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-xs text-red-800">
            {article.type === "journal" ? "ARTICLE" : "BLOG"}
          </div>
          <span className="text-xs text-muted-foreground">
            {article.publishedAt?.toDateString()}
          </span>
        </div>
        
        <Link href={`/${article.type === "journal" ? "journals" : "blogs"}/${article.slug}`}>
          <h4 className="font-medium text-sm line-clamp-1 hover:underline transition-colors text-stone-900">
            {article.title.toLocaleUpperCase()}
          </h4>
        </Link>
        
        <div className="flex items-center gap-2 mt-1">
          <div className="text-xs text-muted-foreground">
            {renderCompactAuthors()}
          </div>
          
          {article.readTime && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {article.readTime} min read
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}