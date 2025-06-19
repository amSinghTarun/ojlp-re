import prisma from "../prisma"
import type { Prisma } from "@prisma/client"
import { slugify } from "../utils"

export async function getArticles(params: {
  type?: "blog" | "journal"
  limit?: number
  offset?: number
  categoryId?: string
  authorId?: string
  featured?: boolean
}) {
  const { type, limit, offset = 0, categoryId, authorId, featured } = params

  const where: Prisma.ArticleWhereInput = {}

  if (type) {
    where.type = type
  }

  if (categoryId) {
    where.categories = {
      some: {
        categoryId,
      },
    }
  }

  if (authorId) {
    where.authors = {
      some: {
        authorId,
      },
    }
  }

  if (featured !== undefined) {
    where.featured = featured
  }

  return prisma.article.findMany({
    where,
    include: {
      Author: true, // Include single Author field
      authors: {
        include: {
          author: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      journalIssue: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: offset,
    take: limit,
  })
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      Author: true, // Include single Author field
      authors: {
        include: {
          author: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      journalIssue: true,
    },
  })
}

export async function getArticlesByAuthor(authorId: string) {
  return prisma.articleAuthor.findMany({
    where: {
      authorId,
    },
    include: {
      article: {
        include: {
          Author: true, // Include single Author field
          authors: {
            include: {
              author: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          journalIssue: true,
        },
      },
    },
    orderBy: {
      article: {
        createdAt: "desc",
      },
    },
  })
}

export async function getArticlesByJournalIssue(journalIssueId: string) {
  return prisma.article.findMany({
    where: {
      issueId: journalIssueId
    },
    include: {
      Author: true, // Include single Author field for new journal articles
      authors: {
        include: {
          author: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      journalIssue: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function createArticle(data: {
  title: string
  content: string
  excerpt?: string
  type: "blog" | "journal"
  image?: string
  authorIds: string[]
  categoryIds?: string[]
  featured?: boolean
  doi?: string
  keywords?: string[]
  journalIssueId?: string
}) {
  const { authorIds, categoryIds, ...articleData } = data

  return prisma.article.create({
    data: {
      ...articleData,
      slug: slugify(data.title),
      authors: {
        create: authorIds.map((authorId) => ({
          authorId,
        })),
      },
      categories: categoryIds
        ? {
            create: categoryIds.map((categoryId) => ({
              categoryId,
            })),
          }
        : undefined,
    },
    include: {
      Author: true,
      authors: {
        include: {
          author: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  })
}

export async function updateArticle(
  slug: string,
  data: {
    title?: string
    content?: string
    excerpt?: string
    image?: string
    authorIds?: string[]
    categoryIds?: string[]
    featured?: boolean
    doi?: string
    keywords?: string[]
    journalIssueId?: string | null
    type?: "blog" | "journal"
  },
) {
  const { authorIds, categoryIds, ...articleData } = data

  // First, disconnect existing relationships if updating them
  const updateData: any = { ...articleData }

  if (authorIds) {
    // Delete existing author relationships
    await prisma.articleAuthor.deleteMany({
      where: {
        article: {
          slug,
        },
      },
    })

    updateData.authors = {
      create: authorIds.map((authorId) => ({
        authorId,
      })),
    }
  }

  if (categoryIds !== undefined) {
    // Delete existing category relationships
    await prisma.categoryArticle.deleteMany({
      where: {
        article: {
          slug,
        },
      },
    })

    if (categoryIds.length > 0) {
      updateData.categories = {
        create: categoryIds.map((categoryId) => ({
          categoryId,
        })),
      }
    }
  }

  return prisma.article.update({
    where: { slug },
    data: updateData,
    include: {
      Author: true,
      authors: {
        include: {
          author: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  })
}

export async function deleteArticle(slug: string) {
  return prisma.article.delete({
    where: { slug },
  })
}