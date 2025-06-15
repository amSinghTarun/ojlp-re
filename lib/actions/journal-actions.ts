"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const journalIssueSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  volume: z.coerce.number().min(1, "Volume must be at least 1"),
  issue: z.coerce.number().min(1, "Issue must be at least 1"),
  year: z.coerce.number().min(1900, "Year must be valid"),
  publishDate: z.string().min(1, "Publish date is required"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  pdfUrl: z.string().optional(),
  articles: z.array(z.string()).optional(),
})

export type JournalIssueFormData = z.infer<typeof journalIssueSchema>

export async function getJournalIssues() {
  try {
    const issues = await prisma.journalIssue.findMany({
      orderBy: [{ year: "desc" }, { volume: "desc" }, { issue: "desc" }],
      include: {
        articles: true,
      },
    })

    return { issues }
  } catch (error) {
    console.error("Failed to fetch journal issues:", error)
    return { error: "Failed to fetch journal issues" }
  }
}

export async function getJournalIssue(id: string) {
  try {
    const issue = await prisma.journalIssue.findUnique({
      where: { id },
      include: {
        articles: true,
      },
    })

    if (!issue) {
      return { error: "Journal issue not found" }
    }

    return { issue }
  } catch (error) {
    console.error("Failed to fetch journal issue:", error)
    return { error: "Failed to fetch journal issue" }
  }
}

export async function createJournalIssue(data: JournalIssueFormData) {
  try {
    const validatedData = journalIssueSchema.parse(data)

    const { articles, ...issueData } = validatedData

    const issue = await prisma.journalIssue.create({
      data: {
        ...issueData,
        articles:
          articles && articles.length > 0
            ? {
                connect: articles.map((id) => ({ id })),
              }
            : undefined,
      },
    })

    revalidatePath("/admin/journals")
    return { success: true, issue }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") }
    }
    console.error("Failed to create journal issue:", error)
    return { error: "Failed to create journal issue" }
  }
}

export async function updateJournalIssue(id: string, data: JournalIssueFormData) {
  try {
    const validatedData = journalIssueSchema.parse(data)

    const { articles, ...issueData } = validatedData

    // First disconnect all articles
    await prisma.journalIssue.update({
      where: { id },
      data: {
        articles: {
          set: [],
        },
      },
    })

    // Then update with new data and connect new articles
    const issue = await prisma.journalIssue.update({
      where: { id },
      data: {
        ...issueData,
        articles:
          articles && articles.length > 0
            ? {
                connect: articles.map((articleId) => ({ id: articleId })),
              }
            : undefined,
      },
    })

    revalidatePath("/admin/journals")
    revalidatePath(`/admin/journals/${id}/edit`)
    return { success: true, issue }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") }
    }
    console.error("Failed to update journal issue:", error)
    return { error: "Failed to update journal issue" }
  }
}

export async function deleteJournalIssue(id: string) {
  try {
    // First disconnect all articles
    await prisma.journalIssue.update({
      where: { id },
      data: {
        articles: {
          set: [],
        },
      },
    })

    // Then delete the issue
    await prisma.journalIssue.delete({
      where: { id },
    })

    revalidatePath("/admin/journals")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete journal issue:", error)
    return { error: "Failed to delete journal issue" }
  }
}
