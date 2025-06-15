"use server"

import { revalidatePath } from "next/cache"
import { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle } from "../controllers/articles"
import { z } from "zod"

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  excerpt: z.string().optional(),
  type: z.enum(["blog", "journal"]),
  image: z.string().optional(),
  authorIds: z.array(z.string()).min(1, "At least one author is required"),
  categoryIds: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  doi: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  journalIssueId: z.string().optional().nullable(),
})

export async function getPosts(type?: "blog" | "journal") {
  try {
    const posts = await getArticles({ type, limit: 100 })
    return { success: true, data: posts }
  } catch (error) {
    console.error("Failed to fetch posts:", error)
    return { success: false, error: "Failed to fetch posts" }
  }
}

export async function getPost(slug: string) {
  try {
    const post = await getArticleBySlug(slug)
    if (!post) {
      return { success: false, error: "Post not found" }
    }
    return { success: true, data: post }
  } catch (error) {
    console.error(`Failed to fetch post ${slug}:`, error)
    return { success: false, error: "Failed to fetch post" }
  }
}

export async function createPost(data: z.infer<typeof postSchema>) {
  try {
    const validatedData = postSchema.parse(data)
    const post = await createArticle(validatedData)
    revalidatePath("/admin/posts")
    revalidatePath("/blogs")
    if (data.type === "journal") {
      revalidatePath("/journals")
    }
    return { success: true, data: post }
  } catch (error) {
    console.error("Failed to create post:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to create post" }
  }
}

export async function updatePost(slug: string, data: Partial<z.infer<typeof postSchema>>) {
  try {
    const post = await updateArticle(slug, data)
    revalidatePath("/admin/posts")
    revalidatePath(`/blogs/${slug}`)
    revalidatePath(`/blogs/${post?.slug}`)
    if (data.type === "journal") {
      revalidatePath("/journals")
      revalidatePath(`/journals/${slug}`)
      revalidatePath(`/journals/${post?.slug}`)
    }
    return { success: true, data: post }
  } catch (error) {
    console.error(`Failed to update post ${slug}:`, error)
    return { success: false, error: "Failed to update post" }
  }
}

export async function deletePost(slug: string) {
  try {
    await deleteArticle(slug)
    revalidatePath("/admin/posts")
    revalidatePath("/blogs")
    revalidatePath("/journals")
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete post ${slug}:`, error)
    return { success: false, error: "Failed to delete post" }
  }
}
