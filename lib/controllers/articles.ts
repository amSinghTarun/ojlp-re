// lib/controllers/articles.ts - Updated for AuthorArticle junction table with Google Doc PDF download
import { prisma } from "@/lib/prisma"
import { ArticleType } from "@prisma/client"

export interface ArticleFilters {
  type?: ArticleType | 'all'
  limit?: number
  offset?: number
  categoryId?: string
  authorId?: string
  issueId?: string
  featured?: boolean
  carousel?: boolean
  archived?: boolean
  search?: string
}

export interface HomePageData {
  carouselArticles: any[]
  recentArticles: any[]
  featuredArticles: any[]
}

export interface GoogleDocDownloadResult {
  success: boolean
  buffer?: Buffer
  filename?: string
  error?: string
}

// Base include for consistent article data - FIXED to use proper AuthorArticle table
const articleInclude = {
  authors: {
    include: {
      author: true
    },
    orderBy: {
      authorOrder: 'asc' as const
    }
  },
  JournalIssue: true,
}

/**
 * OPTIMIZED: Single function to get all home page data in one database call
 * This reduces 3 separate database calls to 1
 */
export async function getHomePageData(): Promise<HomePageData> {
  try {
    // Get all articles we need in one query
    const allArticles = await prisma.article.findMany({
      where: {
        archived: false, // Only non-archived articles
      },
      include: articleInclude,
      orderBy: {
        publishedAt: 'desc'
      },
      take: 50 // Get enough to satisfy all sections
    })

    console.log(`📊 Retrieved ${allArticles.length} total articles for home page`)

    // Separate articles by type and special flags
    const carouselArticles = allArticles
      .filter(article => article.carousel)
      .slice(0, 5) // Limit carousel to 5 items

    console.log(`🎠 Found ${carouselArticles.length} carousel articles`)

    const featuredArticles = allArticles
      .filter(article => article.featured ) // FIXED: Exclude carousel from featured
      .slice(0, 6) // Limit featured to 6 items

    console.log(`⭐ Found ${featuredArticles.length} featured articles (excluding carousel)`)

    // For recent articles: Get mixed blogs and journals (3 of each) based on published time
    const nonCarouselNonFeatured = allArticles
      .filter(article => !article.carousel && !article.featured)

    const recentBlogs = nonCarouselNonFeatured
      .filter(article => article.type === 'blog')
      .slice(0, 3)

    const recentJournals = nonCarouselNonFeatured
      .filter(article => article.type === 'journal')
      .slice(0, 3)

    // Combine and sort by published date to maintain chronological order
    const recentArticles = [...recentBlogs, ...recentJournals]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 6) // Ensure we only take 6 total

    console.log(`📰 Found ${recentArticles.length} recent articles (${recentBlogs.length} blogs, ${recentJournals.length} journals)`)

    return {
      carouselArticles,
      recentArticles,
      featuredArticles
    }
  } catch (error) {
    console.error("Error fetching home page data:", error)
    throw new Error("Failed to fetch home page data")
  }
}

/**
 * NEW: Download Google Doc as PDF with all formatting preserved
 * Supports both client-side and server-side usage
 */
export async function downloadGoogleDocAsPDF(
  contentLink: string, 
  filename?: string
): Promise<GoogleDocDownloadResult> {
  try {

    // Validate if it's a Google Docs URL
    if (!isValidGoogleDocsUrl(contentLink)) {
      return {
        success: false,
        error: 'Invalid Google Docs URL provided'
      }
    }

    // Extract document ID from the URL
    const docId = extractDocIdFromUrl(contentLink)
    if (!docId) {
      return {
        success: false,
        error: 'Could not extract document ID from URL'
      }
    }

    // Construct the PDF export URL
    const pdfUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`
    
    console.log(`📄 Attempting to download Google Doc as PDF: ${docId}`)

    // Fetch the PDF
    const response = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LegalInsight/1.0)'
      }
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch PDF: ${response.status} ${response.statusText}`)
      
      // Provide more specific error messages
      if (response.status === 403) {
        return {
          success: false,
          error: 'Access denied. The document may be private or sharing restrictions apply.'
        }
      } else if (response.status === 404) {
        return {
          success: false,
          error: 'Document not found. Please check the URL and try again.'
        }
      } else {
        return {
          success: false,
          error: `Failed to fetch document: ${response.status} ${response.statusText}`
        }
      }
    }

    // Get the PDF buffer
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Generate filename if not provided
    const pdfFilename = filename || `google-doc-${docId}.pdf`
    
    console.log(`✅ Successfully downloaded Google Doc PDF: ${pdfFilename} (${buffer.length} bytes)`)

    return {
      success: true,
      buffer,
      filename: pdfFilename
    }

  } catch (error) {
    console.error('❌ Error downloading Google Doc as PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * NEW: Download article content as PDF (supports both Google Docs and direct content)
 */
export async function downloadArticleAsPDF(
  articleSlug: string,
  filename?: string
): Promise<GoogleDocDownloadResult> {
  try {
    // Get the article
    const article = await getArticleBySlug(articleSlug)
    
    if (!article) {
      return {
        success: false,
        error: 'Article not found'
      }
    }

    // If article has a contentLink and it's a Google Doc, download from there
    if (article.contentLink && isValidGoogleDocsUrl(article.contentLink)) {
      const customFilename = filename || `${article.slug}.pdf`
      return await downloadGoogleDocAsPDF(article.contentLink, customFilename)
    }

    // If no contentLink or not a Google Doc, return error for now
    // In the future, you could generate PDF from article.content
    return {
      success: false,
      error: 'No downloadable content link available for this article'
    }

  } catch (error) {
    console.error('Error downloading article as PDF:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * NEW: Utility function to check if URL is a valid Google Docs URL
 */
function isValidGoogleDocsUrl(url: string): boolean {
  return /^https:\/\/docs\.google\.com\/document\//.test(url)
}

/**
 * NEW: Extract document ID from various Google Docs URL formats
 */
function extractDocIdFromUrl(url: string): string | null {
  try {
    // Handle different Google Docs URL formats
    const patterns = [
      /\/document\/d\/([a-zA-Z0-9-_]+)/,  // Standard format
      /\/d\/([a-zA-Z0-9-_]+)/,           // Short format
      /id=([a-zA-Z0-9-_]+)/,             // Query parameter format
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting document ID:', error)
    return null
  }
}

/**
 * NEW: Get document info from Google Docs URL
 */
export function getGoogleDocInfo(url: string) {
  // url = 'https://docs.google.com/document/d/1YTElTLc7s7HgyvB1wVhuwVoTWuCTZOXWpLNOqlqqTn0/edit?usp=sharing'
  const docId = extractDocIdFromUrl(url)
  return {
    docId,
    isValid: !!docId && isValidGoogleDocsUrl(url),
    exportUrl: docId ? `https://docs.google.com/document/d/${docId}/export?format=pdf` : null,
    isGoogleDoc: isValidGoogleDocsUrl(url)
  }
}

/**
 * Get carousel articles specifically
 */
export async function getCarouselArticles(limit: number = 5) {
  try {
    return await prisma.article.findMany({
      where: {
        carousel: true,
        archived: false,
      },
      include: articleInclude,
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error("Error fetching carousel articles:", error)
    throw new Error("Failed to fetch carousel articles")
  }
}

/**
 * Get featured articles (excluding carousel articles)
 */
export async function getFeaturedArticles(limit: number = 6) {
  try {
    return await prisma.article.findMany({
      where: {
        featured: true,
        carousel: false, // Exclude carousel articles from featured
        archived: false,
      },
      include: articleInclude,
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error("Error fetching featured articles:", error)
    throw new Error("Failed to fetch featured articles")
  }
}

/**
 * Get articles with flexible filtering - UPDATED for proper AuthorArticle filtering
 */
export async function getArticles(filters: ArticleFilters = {}) {
  try {
    const {
      type,
      limit = 10,
      offset = 0,
      categoryId,
      authorId,
      issueId,
      featured,
      carousel,
      archived = false,
      search
    } = filters

    // Build where clause
    const where: any = {
      archived: archived
    }

    // Add type filter
    if (type && type !== 'all') {
      where.type = type
    }

    // REMOVED: Category filter (categories removed from schema)
    // if (categoryId) {
    //   where.categories = {
    //     some: {
    //       categoryId: categoryId
    //     }
    //   }
    // }

    // FIXED: Add author filter using proper AuthorArticle table
    if (authorId) {
      where.authors = {
        some: {
          authorId: authorId
        }
      }
    }

    // Add journal issue filter
    if (issueId) {
      where.issueId = issueId
    }

    // Add featured filter
    if (featured !== undefined) {
      where.featured = featured
    }

    // Add carousel filter
    if (carousel !== undefined) {
      where.carousel = carousel
    }

    // FIXED: Add search filter - updated field names (abstract instead of excerpt)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { keywords: { hasSome: [search] } },
        // ADDED: Search in author names through junction table
        {
          authors: {
            some: {
              author: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          }
        }
      ]
    }

    return await prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: {
        publishedAt: 'desc'
      },
      skip: offset,
      take: limit
    })
  } catch (error) {
    console.error("Error fetching articles:", error)
    throw new Error("Failed to fetch articles")
  }
}

/**
 * Get article by slug - UPDATED with proper view increment
 */
export async function getArticleBySlug(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: articleInclude
    })

    if (article) {
      // ASYNC: Increment view count without blocking the response
      prisma.article.update({
        where: { id: article.id },
        data: { views: { increment: 1 } }
      }).catch(error => {
        console.error("Error incrementing view count:", error)
        // Don't throw - this shouldn't block article loading
      })
    }

    return article
  } catch (error) {
    console.error("Error fetching article by slug:", error)
    throw new Error("Failed to fetch article")
  }
}

/**
 * Get blog articles specifically
 */
export async function getBlogs(limit?: number) {
  return getArticles({ type: 'blog', limit })
}

/**
 * Get journal articles specifically
 */
export async function getJournalArticles(limit?: number) {
  return getArticles({ type: 'journal', limit })
}

/**
 * Get recent articles (excluding carousel and featured)
 */
export async function getRecentArticles(limit: number = 6) {
  try {
    return await prisma.article.findMany({
      where: {
        archived: false,
        featured: false,
        carousel: false,
      },
      include: articleInclude,
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error("Error fetching recent articles:", error)
    throw new Error("Failed to fetch recent articles")
  }
}

/**
 * Get articles by journal issue ID
 */
export async function getArticlesByJournalIssue(issueId: string) {
  try {
    return await prisma.article.findMany({
      where: {
        issueId: issueId,
        type: 'journal',
        archived: false,
      },
      include: articleInclude,
      orderBy: {
        publishedAt: 'desc'
      }
    })
  } catch (error) {
    console.error("Error fetching articles by journal issue:", error)
    throw new Error("Failed to fetch articles for journal issue")
  }
}

/**
 * FIXED: Get related articles based on keywords or author using proper AuthorArticle table
 */
export async function getRelatedArticles(
  articleId: string,
  keywords?: string[],
  authorIds?: string[],
  limit: number = 3
) {
  try {
    const where: any = {
      id: { not: articleId },
      archived: false,
      OR: []
    }

    // Add keyword-based matching
    if (keywords && keywords.length > 0) {
      where.OR.push({
        keywords: { hasSome: keywords }
      })
    }

    // FIXED: Add author-based matching using AuthorArticle junction table
    if (authorIds && authorIds.length > 0) {
      where.OR.push({
        authors: {
          some: {
            authorId: { in: authorIds }
          }
        }
      })
    }

    // If no OR conditions, just get recent articles
    if (where.OR.length === 0) {
      delete where.OR
    }

    return await prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    })
  } catch (error) {
    console.error("Error fetching related articles:", error)
    throw new Error("Failed to fetch related articles")
  }
}

/**
 * Get article counts for statistics
 */
export async function getArticleStats() {
  try {
    const [totalArticles, publishedArticles, featuredArticles, carouselArticles] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { archived: false } }),
      prisma.article.count({ where: { featured: true, archived: false } }),
      prisma.article.count({ where: { carousel: true, archived: false } })
    ])

    return {
      total: totalArticles,
      published: publishedArticles,
      featured: featuredArticles,
      carousel: carouselArticles,
      archived: totalArticles - publishedArticles
    }
  } catch (error) {
    console.error("Error fetching article stats:", error)
    throw new Error("Failed to fetch article statistics")
  }
}

/**
 * ADDED: Get articles by author using proper AuthorArticle junction table
 */
export async function getArticlesByAuthor(authorId: string, limit?: number) {
  return getArticles({ authorId, limit })
}

/**
 * ADDED: Get articles by author slug for SEO-friendly URLs
 */
export async function getArticlesByAuthorSlug(authorSlug: string, limit?: number) {
  try {
    // First get the author by slug
    const author = await prisma.author.findUnique({
      where: { slug: authorSlug }
    })

    if (!author) {
      return []
    }

    return getArticles({ authorId: author.id, limit })
  } catch (error) {
    console.error("Error fetching articles by author slug:", error)
    throw new Error("Failed to fetch articles by author")
  }
}

/**
 * ADDED: Search articles with better author name matching
 */
export async function searchArticles(query: string, limit: number = 20) {
  try {
    return await prisma.article.findMany({
      where: {
        archived: false,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { abstract: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: [query] } },
          // Search in author names
          {
            authors: {
              some: {
                author: {
                  name: { contains: query, mode: 'insensitive' }
                }
              }
            }
          }
        ]
      },
      include: articleInclude,
      orderBy: [
        { featured: 'desc' }, // Featured articles first
        { publishedAt: 'desc' }
      ],
      take: limit
    })
  } catch (error) {
    console.error("Error searching articles:", error)
    throw new Error("Failed to search articles")
  }
}

/**
 * ADDED: Get trending articles based on views and recency
 */
export async function getTrendingArticles(limit: number = 6) {
  try {
    return await prisma.article.findMany({
      where: {
        archived: false,
      },
      include: articleInclude,
      orderBy: [
        { views: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit
    })
  } catch (error) {
    console.error("Error fetching trending articles:", error)
    throw new Error("Failed to fetch trending articles")
  }
}

/**
 * ADDED: Get authors with their article counts
 */
export async function getAuthorsWithArticleCounts(limit?: number) {
  try {
    const authors = await prisma.author.findMany({
      include: {
        authorArticles: {
          where: {
            article: {
              archived: false
            }
          },
          include: {
            article: {
              select: {
                id: true,
                type: true,
                views: true
              }
            }
          }
        }
      },
      take: limit
    })

    // Transform to include counts and total views
    return authors.map(author => ({
      ...author,
      articleCount: author.authorArticles.length,
      totalViews: author.authorArticles.reduce((sum, rel) => sum + (rel.article.views || 0), 0),
      blogCount: author.authorArticles.filter(rel => rel.article.type === 'blog').length,
      journalCount: author.authorArticles.filter(rel => rel.article.type === 'journal').length,
    }))
  } catch (error) {
    console.error("Error fetching authors with article counts:", error)
    throw new Error("Failed to fetch authors with article counts")
  }
}

// Legacy functions for backward compatibility
export async function getAllArticles() {
  return getArticles()
}

export async function getArticlesByType(type: ArticleType, limit?: number) {
  return getArticles({ type, limit })
}

// REMOVED: Category functions since categories are not in the current schema
// export async function getArticlesByCategory(categoryId: string, limit?: number) {
//   return getArticles({ categoryId, limit })
// }