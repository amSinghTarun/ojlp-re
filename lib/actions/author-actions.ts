"use server"

import { revalidatePath } from "next/cache"
import { getAuthors, getAuthorBySlug, createAuthor, updateAuthor, deleteAuthor } from "../controllers/authors"
import { z } from "zod"

const authorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  title: z.string().optional(),
  bio: z.string().optional(),
  image: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      email: z.string().email().optional(),
      orcid: z.string().optional(),
    })
    .optional(),
  userId: z.string().optional(),
})

export async function getAuthorsList() {
  try {
    const authors = await getAuthors()
    return { success: true, data: authors }
  } catch (error) {
    console.error("Failed to fetch authors:", error)
    return { success: false, error: "Failed to fetch authors" }
  }
}

export async function getAuthorDetail(slug: string) {
  try {
    const author = await getAuthorBySlug(slug)
    if (!author) {
      return { success: false, error: "Author not found" }
    }
    return { success: true, data: author }
  } catch (error) {
    console.error(`Failed to fetch author ${slug}:`, error)
    return { success: false, error: "Failed to fetch author" }
  }
}

export async function createNewAuthor(data: z.infer<typeof authorSchema>) {
  try {
    const validatedData = authorSchema.parse(data)
    const author = await createAuthor(validatedData)
    revalidatePath("/admin/authors")
    revalidatePath("/authors")
    return { success: true, data: author }
  } catch (error) {
    console.error("Failed to create author:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: "Failed to create author" }
  }
}

export async function updateExistingAuthor(slug: string, data: Partial<z.infer<typeof authorSchema>>) {
  try {
    const author = await updateAuthor(slug, data)
    revalidatePath("/admin/authors")
    revalidatePath(`/authors/${slug}`)
    revalidatePath(`/authors/${author.slug}`)
    return { success: true, data: author }
  } catch (error) {
    console.error(`Failed to update author ${slug}:`, error)
    return { success: false, error: "Failed to update author" }
  }
}

export async function deleteExistingAuthor(slug: string) {
  try {
    await deleteAuthor(slug)
    revalidatePath("/admin/authors")
    revalidatePath("/authors")
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete author ${slug}:`, error)
    return { success: false, error: "Failed to delete author" }
  }
}
