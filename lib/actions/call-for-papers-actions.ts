"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const callForPapersSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  thematicFocus: z.string().min(1, "Thematic focus is required"),
  deadline: z.string().min(1, "Deadline is required"),
  description: z.string().min(1, "Description is required"),
  volume: z.coerce.number().min(1, "Volume must be at least 1"),
  issue: z.coerce.number().min(1, "Issue must be at least 1"),
  year: z.coerce.number().min(1900, "Year must be valid"),
  image: z.string().optional(),
  submissionGuidelines: z.string().optional(),
  contactEmail: z.string().email("Invalid email address").optional(),
})

export type CallForPapersFormData = z.infer<typeof callForPapersSchema>

export async function getCallsForPapers() {
  try {
    const calls = await prisma.callForPapers.findMany({
      orderBy: {
        deadline: "asc",
      },
    })

    return { calls }
  } catch (error) {
    console.error("Failed to fetch calls for papers:", error)
    return { error: "Failed to fetch calls for papers" }
  }
}

export async function getCallForPapers(id: string) {
  try {
    const call = await prisma.callForPapers.findUnique({
      where: { id },
    })

    if (!call) {
      return { error: "Call for papers not found" }
    }

    return { call }
  } catch (error) {
    console.error("Failed to fetch call for papers:", error)
    return { error: "Failed to fetch call for papers" }
  }
}

export async function createCallForPapers(data: CallForPapersFormData) {
  try {
    const validatedData = callForPapersSchema.parse(data)

    const call = await prisma.callForPapers.create({
      data: validatedData,
    })

    revalidatePath("/admin/call-for-papers")
    return { success: true, call }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") }
    }
    console.error("Failed to create call for papers:", error)
    return { error: "Failed to create call for papers" }
  }
}

export async function updateCallForPapers(id: string, data: CallForPapersFormData) {
  try {
    const validatedData = callForPapersSchema.parse(data)

    const call = await prisma.callForPapers.update({
      where: { id },
      data: validatedData,
    })

    revalidatePath("/admin/call-for-papers")
    revalidatePath(`/admin/call-for-papers/${id}/edit`)
    return { success: true, call }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") }
    }
    console.error("Failed to update call for papers:", error)
    return { error: "Failed to update call for papers" }
  }
}

export async function deleteCallForPapers(id: string) {
  try {
    await prisma.callForPapers.delete({
      where: { id },
    })

    revalidatePath("/admin/call-for-papers")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete call for papers:", error)
    return { error: "Failed to delete call for papers" }
  }
}
