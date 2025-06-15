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
      journalIssueId,
    },
    include: {
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

  // Generate slug from title
  const slug = slugify(data.title)

  return prisma.article.create({
    data: {
      ...articleData,
      slug,
      authors: {
        create: authorIds.map((authorId) => ({
          author: {
            connect: { id: authorId },
          },
        })),
      },
      categories: {
        create:
          categoryIds?.map((categoryId) => ({
            category: {
              connect: { id: categoryId },
            },
          })) || [],
      },
    },
    include: {
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
  },
) {
  const { authorIds, categoryIds, ...articleData } = data

  // If title is updated, update slug as well
  if (data.title) {
    articleData.slug = slugify(data.title)
  }

  // Start a transaction to handle the complex update
  return prisma.$transaction(async (tx) => {
    // Update the article basic data
    const article = await tx.article.update({
      where: { slug },
      data: articleData,
    })

    // If authorIds is provided, update the authors
    if (authorIds) {
      // Delete existing author relationships
      await tx.articleAuthor.deleteMany({
        where: { articleId: article.id },
      })

      // Create new author relationships
      await Promise.all(
        authorIds.map((authorId) =>
          tx.articleAuthor.create({
            data: {
              articleId: article.id,
              authorId,
            },
          }),
        ),
      )
    }

    // If categoryIds is provided, update the categories
    if (categoryIds) {
      // Delete existing category relationships
      await tx.articleCategory.deleteMany({
        where: { articleId: article.id },
      })

      // Create new category relationships
      await Promise.all(
        categoryIds.map((categoryId) =>
          tx.articleCategory.create({
            data: {
              articleId: article.id,
              categoryId,
            },
          }),
        ),
      )
    }

    // Return the updated article with all relationships
    return tx.article.findUnique({
      where: { id: article.id },
      include: {
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
  })
}

export async function deleteArticle(slug: string) {
  return prisma.article.delete({
    where: { slug },
  })
}

export async function getFeaturedArticles(limit = 4) {
  return prisma.article.findMany({
    where: {
      featured: true,
    },
    include: {
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
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  })
}

export async function getCategories() {
  return prisma.category.findMany()
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
  })
}

export async function createCategory(data: { name: string }) {
  return prisma.category.create({
    data: {
      name: data.name,
      slug: slugify(data.name),
    },
  })
}

export async function updateCategory(id: string, data: { name?: string }) {
  const updateData: any = { ...data }

  if (data.name) {
    updateData.slug = slugify(data.name)
  }

  return prisma.category.update({
    where: { id },
    data: updateData,
  })
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({
    where: { id },
  })
}
