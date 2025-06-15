"use client"

import { useState } from "react"
import { Check, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Article } from "@/lib/types"

type CitationStyle = "APA" | "MLA" | "Chicago" | "Harvard" | "Bluebook" | "OSCOLA"

interface JournalCitationProps {
  article: Article
}

export function JournalCitation({ article }: JournalCitationProps) {
  const [copiedStyle, setCopiedStyle] = useState<CitationStyle | null>(null)

  // Extract year and other date components
  const dateParts = article.date.split(" ")
  const month = dateParts[0]
  const day = dateParts[1].replace(",", "")
  const year = dateParts[2]

  // Get primary author's last name for certain citation styles
  const getPrimaryAuthor = () => {
    if (article.authors && article.authors.length > 0) {
      const authorParts = article.authors[0].name.split(" ")
      return {
        lastName: authorParts[authorParts.length - 1],
        firstName: authorParts[0],
        firstNameInitial: authorParts[0].charAt(0),
      }
    } else if (article.author) {
      const authorParts = article.author.split(" ")
      return {
        lastName: authorParts[authorParts.length - 1],
        firstName: authorParts[0],
        firstNameInitial: authorParts[0].charAt(0),
      }
    }
    return { lastName: "Unknown", firstName: "Author", firstNameInitial: "A" }
  }

  const primaryAuthor = getPrimaryAuthor()

  // Format multiple authors for different citation styles
  const formatAuthors = (style: CitationStyle): string => {
    if (!article.authors || article.authors.length === 0) {
      return article.author || "Unknown Author"
    }

    const authors = article.authors

    switch (style) {
      case "APA":
        if (authors.length === 1) {
          const parts = authors[0].name.split(" ")
          const lastName = parts[parts.length - 1]
          const firstInitial = parts[0].charAt(0)
          return `${lastName}, ${firstInitial}.`
        } else if (authors.length === 2) {
          const author1Parts = authors[0].name.split(" ")
          const author1LastName = author1Parts[author1Parts.length - 1]
          const author1FirstInitial = author1Parts[0].charAt(0)

          const author2Parts = authors[1].name.split(" ")
          const author2LastName = author2Parts[author2Parts.length - 1]
          const author2FirstInitial = author2Parts[0].charAt(0)

          return `${author1LastName}, ${author1FirstInitial}., & ${author2LastName}, ${author2FirstInitial}.`
        } else {
          const firstAuthorParts = authors[0].name.split(" ")
          const firstAuthorLastName = firstAuthorParts[firstAuthorParts.length - 1]
          const firstAuthorFirstInitial = firstAuthorParts[0].charAt(0)
          return `${firstAuthorLastName}, ${firstAuthorFirstInitial}., et al.`
        }

      case "MLA":
        if (authors.length === 1) {
          const parts = authors[0].name.split(" ")
          const lastName = parts[parts.length - 1]
          const firstName = parts[0]
          return `${lastName}, ${firstName}`
        } else if (authors.length === 2) {
          const author1Parts = authors[0].name.split(" ")
          const author1LastName = author1Parts[author1Parts.length - 1]
          const author1FirstName = author1Parts[0]

          const author2Parts = authors[1].name.split(" ")
          const author2LastName = author2Parts[author2Parts.length - 1]
          const author2FirstName = author2Parts[0]

          return `${author1LastName}, ${author1FirstName}, and ${author2FirstName} ${author2LastName}`
        } else {
          const firstAuthorParts = authors[0].name.split(" ")
          const firstAuthorLastName = firstAuthorParts[firstAuthorParts.length - 1]
          const firstAuthorFirstName = firstAuthorParts[0]
          return `${firstAuthorLastName}, ${firstAuthorFirstName}, et al.`
        }

      case "Chicago":
        if (authors.length === 1) {
          return authors[0].name
        } else if (authors.length === 2) {
          return `${authors[0].name} and ${authors[1].name}`
        } else if (authors.length === 3) {
          return `${authors[0].name}, ${authors[1].name}, and ${authors[2].name}`
        } else {
          return `${authors[0].name} et al.`
        }

      case "Harvard":
        if (authors.length === 1) {
          const parts = authors[0].name.split(" ")
          const lastName = parts[parts.length - 1]
          const firstInitial = parts[0].charAt(0)
          return `${lastName}, ${firstInitial}.`
        } else if (authors.length === 2) {
          const author1Parts = authors[0].name.split(" ")
          const author1LastName = author1Parts[author1Parts.length - 1]
          const author1FirstInitial = author1Parts[0].charAt(0)

          const author2Parts = authors[1].name.split(" ")
          const author2LastName = author2Parts[author2Parts.length - 1]
          const author2FirstInitial = author2Parts[0].charAt(0)

          return `${author1LastName}, ${author1FirstInitial}. and ${author2LastName}, ${author2FirstInitial}.`
        } else {
          const firstAuthorParts = authors[0].name.split(" ")
          const firstAuthorLastName = firstAuthorParts[firstAuthorParts.length - 1]
          const firstAuthorFirstInitial = firstAuthorParts[0].charAt(0)
          return `${firstAuthorLastName}, ${firstAuthorFirstInitial}. et al.`
        }

      case "Bluebook":
        if (authors.length === 1) {
          return authors[0].name
        } else if (authors.length === 2) {
          return `${authors[0].name} & ${authors[1].name}`
        } else {
          return `${authors[0].name} et al.`
        }

      case "OSCOLA":
        if (authors.length === 1) {
          const parts = authors[0].name.split(" ")
          const firstName = parts[0]
          const lastName = parts[parts.length - 1]
          return `${firstName} ${lastName}`
        } else if (authors.length === 2) {
          const author1Parts = authors[0].name.split(" ")
          const author1FirstName = author1Parts[0]
          const author1LastName = author1Parts[author1Parts.length - 1]

          const author2Parts = authors[1].name.split(" ")
          const author2FirstName = author2Parts[0]
          const author2LastName = author2Parts[author2Parts.length - 1]

          return `${author1FirstName} ${author1LastName} and ${author2FirstName} ${author2LastName}`
        } else if (authors.length === 3) {
          const author1Parts = authors[0].name.split(" ")
          const author1FirstName = author1Parts[0]
          const author1LastName = author1Parts[author1Parts.length - 1]

          const author2Parts = authors[1].name.split(" ")
          const author2FirstName = author2Parts[0]
          const author2LastName = author2Parts[author2Parts.length - 1]

          const author3Parts = authors[2].name.split(" ")
          const author3FirstName = author3Parts[0]
          const author3LastName = author3Parts[author3Parts.length - 1]

          return `${author1FirstName} ${author1LastName}, ${author2FirstName} ${author2LastName} and ${author3FirstName} ${author3LastName}`
        } else {
          const firstAuthorParts = authors[0].name.split(" ")
          const firstAuthorFirstName = firstAuthorParts[0]
          const firstAuthorLastName = firstAuthorParts[firstAuthorParts.length - 1]
          return `${firstAuthorFirstName} ${firstAuthorLastName} and others`
        }

      default:
        return authors.map((a) => a.name).join(", ")
    }
  }

  // Generate citations in different formats
  const generateCitation = (style: CitationStyle): string => {
    const doiText = article.doi ? `https://doi.org/${article.doi}` : `https://legalinsight.com/journals/${article.slug}`
    const formattedAuthors = formatAuthors(style)

    switch (style) {
      case "APA":
        return `${formattedAuthors} (${year}). ${article.title}. LegalInsight Journal. ${article.doi ? `https://doi.org/${article.doi}` : `Retrieved from https://legalinsight.com/journals/${article.slug}`}`

      case "MLA":
        return `${formattedAuthors}. "${article.title}." LegalInsight Journal, ${day} ${month} ${year}, ${article.doi ? `doi:${article.doi}` : `legalinsight.com/journals/${article.slug}`}.`

      case "Chicago":
        return `${formattedAuthors}. "${article.title}." LegalInsight Journal (${month} ${day}, ${year}). ${article.doi ? `https://doi.org/${article.doi}` : `https://legalinsight.com/journals/${article.slug}`}.`

      case "Harvard":
        return `${formattedAuthors} (${year}) '${article.title}', LegalInsight Journal, ${article.doi ? `DOI: ${article.doi}` : `Available at: https://legalinsight.com/journals/${article.slug}`} (Accessed: ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}).`

      case "Bluebook":
        return `${formattedAuthors}, ${article.title}, LegalInsight J. (${month}. ${day}, ${year}), ${article.doi ? `https://doi.org/${article.doi}` : `https://legalinsight.com/journals/${article.slug}`}.`

      case "OSCOLA":
        return `${formattedAuthors}, '${article.title}' [${year}] LegalInsight Journal ${article.volume || 1}(${article.issue || 1}) ${article.doi ? `<${article.doi}>` : `<https://legalinsight.com/journals/${article.slug}>`} accessed ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`

      default:
        return `${formattedAuthors}. (${year}). ${article.title}. LegalInsight Journal.`
    }
  }

  const handleCopy = async (style: CitationStyle) => {
    try {
      const textToCopy = generateCitation(style)
      await navigator.clipboard.writeText(textToCopy)
      setCopiedStyle(style)
      setTimeout(() => setCopiedStyle(null), 2000)
    } catch (err) {
      console.error("Failed to copy citation:", err)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Quote className="h-4 w-4" />
          <span className="hidden md:inline-block">Cite</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
        <div className="px-2 py-1.5 text-sm font-semibold">Citation Formats</div>
        {(["APA", "MLA", "Chicago", "Harvard", "Bluebook", "OSCOLA"] as CitationStyle[]).map((style) => (
          <DropdownMenuItem
            key={style}
            className="flex flex-col items-start p-3 cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              handleCopy(style)
            }}
          >
            <div className="flex items-center w-full">
              <span className="font-medium">{style}</span>
              {copiedStyle === style && (
                <span className="ml-auto text-xs text-green-500 flex items-center">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copied
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground break-all pr-4">{generateCitation(style)}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
