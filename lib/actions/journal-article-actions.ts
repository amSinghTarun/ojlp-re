"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const journalArticleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  author: z.string().min(1, "Author is required"),
  authorId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  image: z.string().optional(),
  pdfUrl: z.string().optional(),
  doi: z.string().optional(),
  volume: z.coerce.number().optional(),
  issue: z.coerce.number().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  type: z.enum(["blog", "journal"]).default("journal"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
})

export type JournalArticleFormData = z.infer<typeof journalArticleSchema>

export async function getJournalArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        type: "journal",
      },
      orderBy: {
        date: "desc",
      },
      include: {
        author: true,
        categories: true,
        tags: true,
      },
    })

    return { articles }
  } catch (error) {
    console.error("Failed to fetch journal articles:", error)
    return { error: "Failed to fetch journal articles" }
  }
}

export async function getJournalArticle(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        categories: true,
        tags: true,
      },
    })

    if (!article) {
      return { error: "Journal article not found" }
    }

    return { article }
  } catch (error) {
    console.error("Failed to fetch journal article:", error)
    return { error: "Failed to fetch journal article" }
  }
}

export async function createJournalArticle(data: JournalArticleFormData) {
  try {
    const validatedData = journalArticleSchema.parse(data)

    const { categories, tags, authorId, ...articleData } = validatedData

    const article = await prisma.article.create({
      data: {
        ...articleData,
        type: "journal",
        author: authorId ? { connect: { id: authorId } } : undefined,
        categories:
          categories && categories.length > 0
            ? {
                connectOrCreate: categories.map((name) => ({
                  where: { name },
                  create: { name },
                })),
              }
            : undefined,
        tags:
          tags && tags.length > 0
            ? {
                connectOrCreate: tags.map((name) => ({
                  where: { name },
                  create: { name },
                })),
              }
            : undefined,
      },
    })

    revalidatePath("/admin/journal-articles")
    return { success: true, article }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") }
    }
    console.error("Failed to create journal article:", error)
    return { error: "Failed to create journal article" }
  }
}

export async function updateJournalArticle(slug: string, data: JournalArticleFormData) {
  try {
    const validatedData = journalArticleSchema.parse(data)

    const { categories, tags, authorId, ...articleData } = validatedData

    // First disconnect all categories and tags
    await prisma.article.update({
      where: { slug },
      data: {
        categories: { set: [] },
        tags: { set: [] },
      },
    })

    // Then update with new data
    const article = await prisma.article.update({
      where: { slug },
      data: {
        ...articleData,
        author: authorId ? { connect: { id: authorId } } : undefined,
        categories:
          categories && categories.length > 0
            ? {
                connectOrCreate: categories.map((name) => ({
                  where: { name },
                  create: { name },
                })),
              }
            : undefined,
        tags:
          tags && tags.length > 0
            ? {
                connectOrCreate: tags.map((name) => ({
                  where: { name },
                  create: { name },
                })),
              }
            : undefined,
      },
    })

    revalidatePath("/admin/journal-articles")
    revalidatePath(`/admin/journal-articles/${slug}/edit`)
    revalidatePath(`/journals/${slug}`)
    return { success: true, article }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") }
    }
    console.error("Failed to update journal article:", error)
    return { error: "Failed to update journal article" }
  }
}

export async function deleteJournalArticle(slug: string) {
  try {
    // First disconnect all categories and tags
    await prisma.article.update({
      where: { slug },
      data: {
        categories: { set: [] },
        tags: { set: [] },
      },
    })

    // Then delete the article
    await prisma.article.delete({
      where: { slug },
    })

    revalidatePath("/admin/journal-articles")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete journal article:", error)
    return { error: "Failed to delete journal article" }
  }
}
