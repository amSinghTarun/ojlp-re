// components/article-card.tsx - UPDATED for multiple authors support
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, User, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollReveal } from "@/components/scroll-reveal"

interface Author {
  id: string
  name: string
  slug: string
  email?: string
}

interface ArticleCardProps {
  article: {
    slug: string
    title: string
    excerpt: string
    image: string
    date: string
    // UPDATED: Support both single author (legacy) and multiple authors
    author?: string // Legacy support
    authorSlug?: string // Legacy support
    authors?: Author[] // New multiple authors support
    type: "blog" | "journal"
    readTime: number
    keywords?: string[]
    categories?: string[]
  }
  index?: number
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  // UPDATED: Handle both legacy single author and new multiple authors
  const authors = article.authors || []
  const hasMultipleAuthors = authors.length > 1
  const primaryAuthor = authors.length > 0 ? authors[0] : null
  
  // Fallback to legacy author data if no authors array
  const displayAuthor = primaryAuthor?.name || article.author || "Unknown Author"
  const displayAuthorSlug = primaryAuthor?.slug || article.authorSlug || ""

  return (
    <ScrollReveal delay={index * 100}>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg group">
        <div className="relative overflow-hidden">
          <Image
            src={article.image}
            alt={article.title}
            width={400}
            height={250}
            className="aspect-[16/10] object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4">
            <Badge 
              variant={article.type === "journal" ? "default" : "secondary"}
              className="bg-white/90 text-black hover:bg-white"
            >
              {article.type === "journal" ? "Journal" : "Blog"}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/${article.type === "journal" ? "journals" : "blogs"}/${article.slug}`}>
              {article.title}
            </Link>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {article.excerpt}
          </p>
          
          {/* UPDATED: Author display with multiple authors support */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasMultipleAuthors ? (
              <Users className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
            <div className="flex flex-wrap items-center gap-1">
              {authors.length > 0 ? (
                <>
                  {/* Show first author with link */}
                  <Link
                    href={`/authors/${displayAuthorSlug}`}
                    className="hover:underline hover:text-primary transition-colors font-medium"
                  >
                    {displayAuthor}
                  </Link>
                  
                  {/* Show additional authors count */}
                  {hasMultipleAuthors && (
                    <span className="text-muted-foreground">
                      +{authors.length - 1} more
                    </span>
                  )}
                </>
              ) : (
                // Fallback to legacy author display
                <Link
                  href={`/authors/${displayAuthorSlug}`}
                  className="hover:underline hover:text-primary transition-colors font-medium"
                >
                  {displayAuthor}
                </Link>
              )}
            </div>
            
            {/* Author count badge for multiple authors */}
            {hasMultipleAuthors && (
              <Badge variant="outline" className="text-xs">
                {authors.length} authors
              </Badge>
            )}
          </div>

          {/* Additional author details for multiple authors */}
          {hasMultipleAuthors && (
            <div className="text-xs text-muted-foreground">
              <div className="flex flex-wrap gap-1">
                {authors.slice(0, 3).map((author, i) => (
                  <span key={author.id}>
                    <Link
                      href={`/authors/${author.slug}`}
                      className="hover:underline hover:text-primary transition-colors"
                    >
                      {author.name}
                    </Link>
                    {i < Math.min(authors.length - 1, 2) && <span>, </span>}
                  </span>
                ))}
                {authors.length > 3 && (
                  <span className="text-muted-foreground">
                    & {authors.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{article.readTime} min</span>
            </div>
          </div>

          {/* Keywords or Categories */}
          {(article.keywords?.length || article.categories?.length) && (
            <div className="flex flex-wrap gap-1">
              {article.keywords?.slice(0, 3).map((keyword, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {article.categories?.slice(0, 3).map((category, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ScrollReveal>
  )
}

// UPDATED: ArticleCard with full article data support
interface FullArticleCardProps {
  article: {
    id: string
    slug: string
    title: string
    excerpt: string
    image: string
    date: Date | string
    readTime: number
    type: "blog" | "journal"
    Authors?: Author[]
    Author?: Author // Legacy support
    keywords?: string[]
    categories?: Array<{ category: { name: string } }>
  }
  index?: number
}

export function FullArticleCard({ article, index = 0 }: FullArticleCardProps) {
  // Extract authors from the full article data structure
  const authors = article.Authors || (article.Author ? [article.Author] : [])
  const categories = article.categories?.map(c => c.category.name) || []

  const formattedDate = typeof article.date === 'string' 
    ? article.date 
    : new Date(article.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

  return (
    <ArticleCard
      article={{
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        image: article.image,
        date: formattedDate,
        authors: authors,
        type: article.type,
        readTime: article.readTime,
        keywords: article.keywords,
        categories: categories,
      }}
      index={index}
    />
  )
}