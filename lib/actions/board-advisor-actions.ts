// "use server"

// import { revalidatePath } from "next/cache"
// import { prisma } from "@/lib/prisma"
// import { z } from "zod"

// const boardAdvisorSchema = z.object({
//   id: z.string().optional(),
//   name: z.string().min(1, "Name is required"),
//   designation: z.string().min(1, "Designation is required"),
//   institution: z.string().optional(),
//   bio: z.string().optional(),
//   image: z.string().optional(),
//   order: z.coerce.number().min(1, "Order must be at least 1"),
//   socialLinks: z.record(z.string()).optional(),
// })

// export type BoardAdvisorFormData = z.infer<typeof boardAdvisorSchema>

// export async function getBoardAdvisors() {
//   try {
//     const advisors = await prisma.boardAdvisor.findMany({
//       orderBy: {
//         order: "asc",
//       },
//     })

//     return { advisors }
//   } catch (error) {
//     console.error("Failed to fetch board advisors:", error)
//     return { error: "Failed to fetch board advisors" }
//   }
// }

// export async function getBoardAdvisor(id: string) {
//   try {
//     const advisor = await prisma.boardAdvisor.findUnique({
//       where: { id },
//     })

//     if (!advisor) {
//       return { error: "Board advisor not found" }
//     }

//     return { advisor }
//   } catch (error) {
//     console.error("Failed to fetch board advisor:", error)
//     return { error: "Failed to fetch board advisor" }
//   }
// }

// export async function createBoardAdvisor(data: BoardAdvisorFormData) {
//   try {
//     const validatedData = boardAdvisorSchema.parse(data)

//     const advisor = await prisma.boardAdvisor.create({
//       data: validatedData,
//     })

//     revalidatePath("/admin/board-advisors")
//     return { success: true, advisor }
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return { error: error.errors.map((e) => e.message).join(", ") }
//     }
//     console.error("Failed to create board advisor:", error)
//     return { error: "Failed to create board advisor" }
//   }
// }

// export async function updateBoardAdvisor(id: string, data: BoardAdvisorFormData) {
//   try {
//     const validatedData = boardAdvisorSchema.parse(data)

//     const advisor = await prisma.boardAdvisor.update({
//       where: { id },
//       data: validatedData,
//     })

//     revalidatePath("/admin/board-advisors")
//     revalidatePath(`/admin/board-advisors/${id}/edit`)
//     return { success: true, advisor }
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return { error: error.errors.map((e) => e.message).join(", ") }
//     }
//     console.error("Failed to update board advisor:", error)
//     return { error: "Failed to update board advisor" }
//   }
// }

// export async function deleteBoardAdvisor(id: string) {
//   try {
//     await prisma.boardAdvisor.delete({
//       where: { id },
//     })

//     revalidatePath("/admin/board-advisors")
//     return { success: true }
//   } catch (error) {
//     console.error("Failed to delete board advisor:", error)
//     return { error: "Failed to delete board advisor" }
//   }
// }

// export async function updateBoardAdvisorOrder(id: string, newOrder: number) {
//   try {
//     const advisor = await prisma.boardAdvisor.update({
//       where: { id },
//       data: { order: newOrder },
//     })

//     revalidatePath("/admin/board-advisors")
//     return { success: true, advisor }
//   } catch (error) {
//     console.error("Failed to update board advisor order:", error)
//     return { error: "Failed to update board advisor order" }
//   }
// }
