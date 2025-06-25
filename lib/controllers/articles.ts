// lib/controllers/articles.ts - UPDATED for multiple authors support
import prisma from "@/lib/prisma"
import { ArticleType } from "@prisma/client"


interface GetArticlesOptions {
  type?: "blog" | "journal"
  limit?: number
  keywords?: string[]
  authorId?: string
  featured?: boolean
}

/**
 * Get a single article by slug with multiple authors - UPDATED
 */
export async function getArticleBySlug(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        // UPDATED: Include multiple authors through AuthorArticle junction
        authors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        JournalIssue: {
          select: {
            id: true,
            title: true,
            volume: true,
            issue: true,
            year: true,
            publishDate: true
          }
        },
        
      }
    })

    if (!article) {
      return null
    }

    // UPDATED: Transform the data to include Authors array for frontend compatibility
    return {
      ...article,
      Authors: article.authors.map(aa => aa.author),
      // Keep primary author for backward compatibility
      Author: article.authors.length > 0 ? article.authors[0].author : null
    }
  } catch (error) {
    console.error("Error fetching article by slug:", error)
    throw new Error("Failed to fetch article")
  }
}

/**
 * Get multiple articles with multiple authors - UPDATED
 */
export async function getArticles(options: GetArticlesOptions = {}) {
  try {
    const { type, limit, keywords, authorId, featured } = options

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (keywords) {
      where.categories = {
        some: {
          keywords: keywords
        }
      }
    }

    if (authorId) {
      where.authors = {
        some: {
          authorId: authorId
        }
      }
    }

    if (featured !== undefined) {
      // Assuming you have a featured field, otherwise remove this
      where.featured = featured
    }

    // Only show published articles (not drafts) in public views
    where.draft = false

    const articles = await prisma.article.findMany({
      where,
      include: {
        // UPDATED: Include multiple authors through AuthorArticle junction
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                slug: true,
                image: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        JournalIssue: {
          select: {
            id: true,
            title: true,
            volume: true,
            issue: true,
            year: true,
            publishDate: true
          }
        },
        
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // UPDATED: Transform the data to include Authors array for frontend compatibility
    return articles.map(article => ({
      ...article,
      Authors: article.authors.map(aa => aa.author),
      // Keep primary author for backward compatibility
      Author: article.authors.length > 0 ? article.authors[0].author : null
    }))
  } catch (error) {
    console.error("Error fetching articles:", error)
    throw new Error("Failed to fetch articles")
  }
}

/**
 * Get articles by journal issue with multiple authors - UPDATED
 */
export async function getArticlesByJournalIssue(issueId: string) {
  try {
    const articles = await prisma.article.findMany({
      where: {
        issueId: issueId,
        type: ArticleType.journal,
        draft: false // Only published articles
      },
      include: {
        // UPDATED: Include multiple authors through AuthorArticle junction
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                slug: true,
                image: true,
                bio: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // UPDATED: Transform the data to include Authors array for frontend compatibility
    return articles.map(article => ({
      ...article,
      Authors: article.authors.map(aa => aa.author),
      // Keep primary author for backward compatibility
      Author: article.authors.length > 0 ? article.authors[0].author : null
    }))
  } catch (error) {
    console.error("Error fetching articles by journal issue:", error)
    throw new Error("Failed to fetch articles for journal issue")
  }
}

/**
 * Get articles by author with multiple authors - NEW
 */
export async function getArticlesByAuthor(authorId: string, options: { limit?: number; type?: "blog" | "journal" } = {}) {
  try {
    const { limit, type } = options

    const where: any = {
      authors: {
        some: {
          authorId: authorId
        }
      },
      draft: false // Only published articles
    }

    if (type) {
      where.type = type
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                slug: true,
                image: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        JournalIssue: {
          select: {
            id: true,
            title: true,
            volume: true,
            issue: true,
            year: true
          }
        },
        
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transform the data to include Authors array for frontend compatibility
    return articles.map(article => ({
      ...article,
      Authors: article.authors.map(aa => aa.author),
      Author: article.authors.length > 0 ? article.authors[0].author : null
    }))
  } catch (error) {
    console.error("Error fetching articles by author:", error)
    throw new Error("Failed to fetch articles by author")
  }
}

/**
 * Search articles with multiple authors - UPDATED
 */
export async function searchArticles(query: string, options: { limit?: number; type?: "blog" | "journal" } = {}) {
  try {
    const { limit, type } = options

    const where: any = {
      AND: [
        {
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              excerpt: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              keywords: {
                has: query
              }
            },
            {
              authors: {
                some: {
                  author: {
                    name: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  }
                }
              }
            }
          ]
        },
        {
          draft: false
        }
      ]
    }

    if (type) {
      where.AND.push({ type })
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                slug: true,
                image: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        JournalIssue: {
          select: {
            id: true,
            title: true,
            volume: true,
            issue: true,
            year: true
          }
        },
        
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transform the data to include Authors array
    return articles.map(article => ({
      ...article,
      Authors: article.authors.map(aa => aa.author),
      Author: article.authors.length > 0 ? article.authors[0].author : null
    }))
  } catch (error) {
    console.error("Error searching articles:", error)
    throw new Error("Failed to search articles")
  }
}

/**
 * Get featured articles with multiple authors - NEW
 */
export async function getFeaturedArticles(limit: number = 3) {
  try {
    // This assumes you have some way to mark articles as featured
    // You might have a featured field, or use categories, or some other logic
    const articles = await prisma.article.findMany({
      where: {
        draft: false,
        // Add your featured logic here, for example:
        // featured: true,
        // OR you could use view count, date, or categories to determine featured articles
      },
      include: {
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                slug: true,
                image: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        JournalIssue: {
          select: {
            id: true,
            title: true,
            volume: true,
            issue: true,
            year: true
          }
        }
      },
      orderBy: [
        { views: 'desc' }, // Most viewed
        { createdAt: 'desc' } // Most recent
      ],
      take: limit
    })

    return articles.map(article => ({
      ...article,
      Authors: article.authors.map(aa => aa.author),
      Author: article.authors.length > 0 ? article.authors[0].author : null
    }))
  } catch (error) {
    console.error("Error fetching featured articles:", error)
    throw new Error("Failed to fetch featured articles")
  }
}