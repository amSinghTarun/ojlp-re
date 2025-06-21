import Link from "next/link"
import Image from "next/image"
import { Calendar, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Article } from "@/lib/types"

interface ArticleCardProps {
  article: Article
  index?: number
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  return (
    <Card
      className="overflow-hidden law-card border-0 animate-fade-in h-full flex flex-col"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* <div className="relative h-48 sm:h-56 w-full overflow-hidden ornamental-corners">
        <Image
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <Badge
            variant={article.type === "journal" ? "default" : "secondary"}
            className="text-xs font-medium px-2.5 py-0.5 rounded-full tracking-tight"
          >
            
          </Badge>
        </div>
      </div> */}

      <CardContent className="p-5 flex-grow">
        <div className="space-y-3 text-sm">
          <div className="text-muted-foreground pb-2"> {article.type === "journal" ? "Article" : "Blog"}</div>
          <Link
            href={`/${article.type === "journal" ? "journals" : "blogs"}/${article.slug}`}
            className="hover:underline group"
          >
            <h3 className="font-bold text-lg sm:text-xl text-primary transition-colors duration-200">
              {article.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5">
            {/* <User className="h-3.5 w-3.5" /> */}
            {article.authors && article.authors.length > 0 ? (
              <div className="flex flex-wrap gap-1 text-red-800">
                {article.authors.map((author, i) => (
                  <span key={author.slug}>
                    <Link
                      href={`/authors/${author.slug}`}
                      className="hover:underline hover:text-primary transition-colors"
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
                className="hover:underline hover:text-primary transition-colors"
              >
                {article.author}
              </Link>
            )}
          </div>
          <p className=" text-sm line-clamp-3">{article.excerpt}</p>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex flex-wrap items-center text-xs text-muted-foreground gap-4 mt-auto">
        <div className="flex items-center gap-1.5">
          <span>{article.date}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
