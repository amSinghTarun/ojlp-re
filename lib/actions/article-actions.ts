"use server"

import { revalidatePath } from "next/cache"
import {
  createArticle as createArticleDb,
  updateArticle as updateArticleDb,
  deleteArticle as deleteArticleDb,
} from "@/lib/controllers/articles"

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
  try {
    const article = await createArticleDb(data)

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath(`/${data.type === "blog" ? "blogs" : "journals"}/${article.slug}`)
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article }
  } catch (error) {
    console.error("Error creating article:", error)
    return { success: false, error: "Failed to create article" }
  }
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
  try {
    const article = await updateArticleDb(slug, data)

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath(`/${data.type === "blog" ? "blogs" : "journals"}/${article.slug}`)
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true, article }
  } catch (error) {
    console.error("Error updating article:", error)
    return { success: false, error: "Failed to update article" }
  }
}

export async function deleteArticle(slug: string) {
  try {
    const article = await deleteArticleDb(slug)

    // Revalidate relevant paths
    revalidatePath("/")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    revalidatePath("/admin/posts")
    revalidatePath("/admin/journal-articles")

    return { success: true }
  } catch (error) {
    console.error("Error deleting article:", error)
    return { success: false, error: "Failed to delete article" }
  }
}
