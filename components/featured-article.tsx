import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"

interface FeaturedArticleProps {
  article: Article
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 items-center animate-fade-in elegant-shadow rounded-lg overflow-hidden">
      <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden ornamental-corners">
        <Image
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          priority
        />
      </div>
      <div className="space-y-5 p-6 lg:p-8 animate-slide-in-right">
        <div className="space-y-3">
          <h2 className="font-heading text-2xl font-bold tracking-tight lg:text-3xl xl:text-4xl text-balance">
            {article.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{article.readTime} min read</span>
            </div>
          </div>
        </div>
        <p className="font-serif text-muted-foreground text-lg leading-relaxed">{article.excerpt}</p>
        <Button asChild size="lg" className="mt-2 transition-all duration-300 hover:translate-x-1">
          <Link href={`/articles/${article.slug}`}>Read Full Article</Link>
        </Button>
      </div>
    </div>
  )
}
