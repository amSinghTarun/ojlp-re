"use server"

import { revalidatePath } from "next/cache"
import {
  getEditorialBoardMembers,
  getEditorialBoardMemberById,
  createEditorialBoardMember,
  updateEditorialBoardMember,
  deleteEditorialBoardMember,
  reorderEditorialBoardMembers,
} from "../controllers/editorial-board"
import { z } from "zod"
import { BoardMemberType } from "@prisma/client"

const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  designation: z.string().min(2, "Designation must be at least 2 characters"),
  memberType: z.nativeEnum(BoardMemberType, {
    required_error: "Member type is required",
  }),
  image: z.string().min(1, "Image is required"),
  order: z.number().optional(),
  bio: z.string().optional(),
  detailedBio: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  expertise: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  publications: z.array(z.string()).optional(),
  location: z.string().optional(),
  affiliation: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  orcid: z.string().optional(),
})

export async function getEditorialBoard() {
  try {
    const members = await getEditorialBoardMembers()
    return { success: true, data: members }
  } catch (error) {
    console.error("Failed to fetch editorial board members:", error)
    return { success: false, error: "Failed to fetch editorial board members" }
  }
}

export async function getEditorialBoardMember(id: string) {
  try {
    const member = await getEditorialBoardMemberById(id)
    if (!member) {
      return { success: false, error: "Member not found" }
    }
    return { success: true, data: member }
  } catch (error) {
    console.error(`Failed to fetch editorial board member ${id}:`, error)
    return { success: false, error: "Failed to fetch editorial board member" }
  }
}

export async function createBoardMember(data: z.infer<typeof memberSchema>) {
  try {
    const validatedData = memberSchema.parse(data)
    const member = await createEditorialBoardMember(validatedData)
    revalidatePath("/admin/editorial-board")
    revalidatePath("/editorial-board")
    return { success: true, data: member }
  } catch (error) {
    console.error("Failed to create editorial board member:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to create editorial board member" }
  }
}

export async function updateBoardMember(id: string, data: Partial<z.infer<typeof memberSchema>>) {
  try {
    const validatedData = memberSchema.partial().parse(data)
    const member = await updateEditorialBoardMember(id, validatedData)
    revalidatePath("/admin/editorial-board")
    revalidatePath("/editorial-board")
    return { success: true, data: member }
  } catch (error) {
    console.error(`Failed to update editorial board member ${id}:`, error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to update editorial board member" }
  }
}

export async function deleteBoardMember(id: string) {
  try {
    await deleteEditorialBoardMember(id)
    revalidatePath("/admin/editorial-board")
    revalidatePath("/editorial-board")
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete editorial board member ${id}:`, error)
    return { success: false, error: "Failed to delete editorial board member" }
  }
}

export async function reorderBoardMembers(orderedIds: string[]) {
  try {
    await reorderEditorialBoardMembers(orderedIds)
    revalidatePath("/admin/editorial-board")
    revalidatePath("/editorial-board")
    return { success: true }
  } catch (error) {
    console.error("Failed to reorder editorial board members:", error)
    return { success: false, error: "Failed to reorder editorial board members" }
  }
}