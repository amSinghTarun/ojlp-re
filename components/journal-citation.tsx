"use client"

import { useState } from "react"
import { Check, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type CitationStyle = "APA" | "MLA" | "Chicago" | "Harvard" | "Bluebook" | "OSCOLA"

// Define proper interfaces based on the existing code structure
interface Author {
  id: string
  name: string
  slug: string
}

interface AuthorArticle {
  author: Author
}

interface JournalIssue {
  volume: number
  issue: number
  year: number
}

interface Article {
  id: string
  title: string
  slug: string
  date?: Date | string // Handle both types
  publishedAt?: Date | string // Alternative date field
  doi?: string
  volume?: number
  issue?: number
  year?: number
  authors?: AuthorArticle[] // New structure with junction table
  author?: string // Legacy field for backward compatibility
  keywords?: string[]
  content?: string
  abstract?: string
  image?: string
  readTime?: number
  archived?: boolean
  views?: number
  createdAt?: Date | string
  updatedAt?: Date | string
  JournalIssue?: JournalIssue
}

interface JournalCitationProps {
  article: Article
}

export function JournalCitation({ article }: JournalCitationProps) {
  const [copiedStyle, setCopiedStyle] = useState<CitationStyle | null>(null)

  // Safely handle date conversion
  const getDateParts = () => {
    let dateObj: Date

    // Try different date fields in order of preference
    if (article.publishedAt) {
      dateObj = article.publishedAt instanceof Date ? article.publishedAt : new Date(article.publishedAt)
    } else if (article.date) {
      dateObj = article.date instanceof Date ? article.date : new Date(article.date)
    } else {
      dateObj = new Date() // Fallback to current date
    }

    // Validate the date
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date() // Fallback if date is invalid
    }

    const month = dateObj.toLocaleDateString('en-US', { month: 'long' })
    const day = dateObj.getDate().toString()
    const year = dateObj.getFullYear().toString()

    return { month, day, year }
  }

  const { month, day, year } = getDateParts()

  // Get primary author's information for certain citation styles
  const getPrimaryAuthor = () => {
    // Use the new authors array structure first
    if (article.authors && article.authors.length > 0) {
      const authorParts = article.authors[0].author.name.split(" ")
      return {
        lastName: authorParts[authorParts.length - 1],
        firstName: authorParts[0],
        firstNameInitial: authorParts[0].charAt(0),
      }
    } 
    // Fallback to legacy author field
    else if (article.author) {
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
    // Get authors array - prioritize new structure
    let authorsData: { name: string }[] = []
    
    if (article.authors && article.authors.length > 0) {
      authorsData = article.authors.map(authorArticle => ({ name: authorArticle.author.name }))
    } else if (article.author) {
      authorsData = [{ name: article.author }]
    }

    if (authorsData.length === 0) {
      return "Unknown Author"
    }

    switch (style) {
      case "APA":
        if (authorsData.length === 1) {
          const parts = authorsData[0].name.split(" ")
          const lastName = parts[parts.length - 1]
          const firstInitial = parts[0].charAt(0)
          return `${lastName}, ${firstInitial}.`
        } else if (authorsData.length === 2) {
          const author1Parts = authorsData[0].name.split(" ")
          const author1LastName = author1Parts[author1Parts.length - 1]
          const author1FirstInitial = author1Parts[0].charAt(0)

          const author2Parts = authorsData[1].name.split(" ")
          const author2LastName = author2Parts[author2Parts.length - 1]
          const author2FirstInitial = author2Parts[0].charAt(0)

          return `${author1LastName}, ${author1FirstInitial}., & ${author2LastName}, ${author2FirstInitial}.`
        } else {
          const firstAuthorParts = authorsData[0].name.split(" ")
          const firstAuthorLastName = firstAuthorParts[firstAuthorParts.length - 1]
          const firstAuthorFirstInitial = firstAuthorParts[0].charAt(0)
          return `${firstAuthorLastName}, ${firstAuthorFirstInitial}., et al.`
        }

      case "MLA":
        if (authorsData.length === 1) {
          const parts = authorsData[0].name.split(" ")
          const lastName = parts[parts.length - 1]
          const firstName = parts[0]
          return `${lastName}, ${firstName}`
        } else if (authorsData.length === 2) {
          const author1Parts = authorsData[0].name.split(" ")
          const author1LastName = author1Parts[author1Parts.length - 1]
          const author1FirstName = author1Parts[0]

          const author2Parts = authorsData[1].name.split(" ")
          const author2LastName = author2Parts[author2Parts.length - 1]
          const author2FirstName = author2Parts[0]

          return `${author1LastName}, ${author1FirstName}, and ${author2FirstName} ${author2LastName}`
        } else {
          const firstAuthorParts = authorsData[0].name.split(" ")
          const firstAuthorLastName = firstAuthorParts[firstAuthorParts.length - 1]
          const firstAuthorFirstName = firstAuthorParts[0]
          return `${firstAuthorLastName}, ${firstAuthorFirstName}, et al.`
        }

      case "Chicago":
        if (authorsData.length === 1) {
          return authorsData[0].name
        } else if (authorsData.length === 2) {
          return `${authorsData[0].name} and ${authorsData[1].name}`
        } else if (authorsData.length === 3) {
          return `${authorsData[0].name}, ${authorsData[1].name}, and ${authorsData[2].name}`
        } else {
          return `${authorsData[0].name} et al.`
        }

      case "Harvard":
        if (authorsData.length === 1) {
          const parts = authorsData[0].name.split(" ")
          const lastName = parts[parts.length - 1]
          const firstInitial = parts[0].charAt(0)
          return `${lastName}, ${firstInitial}.`
        } else if (authorsData.length === 2) {
          const author1Parts = authorsData[0].name.split(" ")
          const author1LastName = author1Parts[author1Parts.length - 1]
          const author1FirstInitial = author1Parts[0].charAt(0)

          const author2Parts = authorsData[1].name.split(" ")
          const author2LastName = author2Parts[author2Parts.length - 1]
          const author2FirstInitial = author2Parts[0].charAt(0)

          return `${author1LastName}, ${author1FirstInitial}. and ${author2LastName}, ${author2FirstInitial}.`
        } else {
          const firstAuthorParts = authorsData[0].name.split(" ")
          const firstAuthorLastName = firstAuthorParts[firstAuthorParts.length - 1]
          const firstAuthorFirstInitial = firstAuthorParts[0].charAt(0)
          return `${firstAuthorLastName}, ${firstAuthorFirstInitial}. et al.`
        }

      case "Bluebook":
        if (authorsData.length === 1) {
          return authorsData[0].name
        } else if (authorsData.length === 2) {
          return `${authorsData[0].name} & ${authorsData[1].name}`
        } else {
          return `${authorsData[0].name} et al.`
        }

      case "OSCOLA":
        if (authorsData.length === 1) {
          const parts = authorsData[0].name.split(" ")
          const firstName = parts[0]
          const lastName = parts[parts.length - 1]
          return `${firstName} ${lastName}`
        } else if (authorsData.length === 2) {
          const author1Parts = authorsData[0].name.split(" ")
          const author1FirstName = author1Parts[0]
          const author1LastName = author1Parts[author1Parts.length - 1]

          const author2Parts = authorsData[1].name.split(" ")
          const author2FirstName = author2Parts[0]
          const author2LastName = author2Parts[author2Parts.length - 1]

          return `${author1FirstName} ${author1LastName} and ${author2FirstName} ${author2LastName}`
        } else if (authorsData.length === 3) {
          const author1Parts = authorsData[0].name.split(" ")
          const author1FirstName = author1Parts[0]
          const author1LastName = author1Parts[author1Parts.length - 1]

          const author2Parts = authorsData[1].name.split(" ")
          const author2FirstName = author2Parts[0]
          const author2LastName = author2Parts[author2Parts.length - 1]

          const author3Parts = authorsData[2].name.split(" ")
          const author3FirstName = author3Parts[0]
          const author3LastName = author3Parts[author3Parts.length - 1]

          return `${author1FirstName} ${author1LastName}, ${author2FirstName} ${author2LastName} and ${author3FirstName} ${author3LastName}`
        } else {
          const firstAuthorParts = authorsData[0].name.split(" ")
          const firstAuthorFirstName = firstAuthorParts[0]
          const firstAuthorLastName = firstAuthorParts[firstAuthorParts.length - 1]
          return `${firstAuthorFirstName} ${firstAuthorLastName} and others`
        }

      default:
        return authorsData.map((a) => a.name).join(", ")
    }
  }

  // Generate citations in different formats
  const generateCitation = (style: CitationStyle): string => {
    const formattedAuthors = formatAuthors(style)
    
    // Get volume and issue info
    const volume = article.JournalIssue?.volume || article.volume || 1
    const issue = article.JournalIssue?.issue || article.issue || 1

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
        return `${formattedAuthors}, '${article.title}' [${year}] LegalInsight Journal ${volume}(${issue}) ${article.doi ? `<${article.doi}>` : `<https://legalinsight.com/journals/${article.slug}>`} accessed ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`

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

  const citationStyles: CitationStyle[] = ["APA", "MLA", "Chicago", "Harvard", "Bluebook", "OSCOLA"]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className=" bg-red-800 rounded-sm flex items-center ">
          <div className=" text-base text-stone-100">Cite</div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[350px] max-w-[90vw] max-h-[280px] overflow-y-auto"
        sideOffset={5}
      >
        <div className="px-2 py-1.5 text-sm font-semibold text-stone-700 border-b">
          Citation Formats
        </div>
        {citationStyles.map((style) => (
          <DropdownMenuItem
            key={style}
            className="flex flex-col items-start p-3 cursor-pointer hover:bg-stone-50 focus:bg-stone-50"
            onClick={(e) => {
              e.preventDefault()
              handleCopy(style)
            }}
          >
            <div className="flex items-center w-full mb-1">
              <span className="font-medium text-stone-800">{style}</span>
              {copiedStyle === style && (
                <span className="ml-auto text-xs text-green-600 flex items-center">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copied
                </span>
              )}
            </div>
            <div className="text-xs text-stone-600 break-words leading-relaxed pr-2">
              {generateCitation(style)}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}