// import prisma from "../prisma"

// export async function getBoardAdvisors() {
//   return prisma.boardAdvisor.findMany({
//     orderBy: {
//       order: "asc",
//     },
//   })
// }

// export async function getBoardAdvisorById(id: string) {
//   return prisma.boardAdvisor.findUnique({
//     where: { id },
//   })
// }

// export async function createBoardAdvisor(data: {
//   name: string
//   designation: string
//   image?: string
//   order?: number
//   bio?: string
//   email?: string
//   expertise?: string[]
//   linkedin?: string
//   orcid?: string
// }) {
//   // Get the highest order number and add 1
//   const highestOrder = await prisma.boardAdvisor.findFirst({
//     orderBy: {
//       order: "desc",
//     },
//     select: {
//       order: true,
//     },
//   })

//   const order = data.order || (highestOrder ? highestOrder.order + 1 : 1)

//   return prisma.boardAdvisor.create({
//     data: {
//       ...data,
//       order,
//     },
//   })
// }

// export async function updateBoardAdvisor(
//   id: string,
//   data: {
//     name?: string
//     designation?: string
//     image?: string
//     order?: number
//     bio?: string
//     email?: string
//     expertise?: string[]
//     linkedin?: string
//     orcid?: string
//   },
// ) {
//   return prisma.boardAdvisor.update({
//     where: { id },
//     data,
//   })
// }

// export async function deleteBoardAdvisor(id: string) {
//   return prisma.boardAdvisor.delete({
//     where: { id },
//   })
// }

// export async function reorderBoardAdvisors(orderedIds: string[]) {
//   // Update the order of each advisor based on their position in the array
//   const updates = orderedIds.map((id, index) => {
//     return prisma.boardAdvisor.update({
//       where: { id },
//       data: { order: index + 1 },
//     })
//   })

//   return Promise.all(updates)
// }
