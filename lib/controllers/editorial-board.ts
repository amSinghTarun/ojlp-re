import prisma from "../prisma"

export async function getEditorialBoardMembers() {
  return prisma.editorialBoardMember.findMany({
    orderBy: {
      order: "asc",
    },
  })
}

export async function getEditorialBoardMemberById(id: string) {
  return prisma.editorialBoardMember.findUnique({
    where: { id },
  })
}

export async function createEditorialBoardMember(data: {
  name: string
  designation: string
  image?: string
  order?: number
  bio?: string
  email?: string
  linkedin?: string
  orcid?: string
  detailedBio?: string
  expertise?: string[]
  education?: string[]
  achievements?: string[]
  publications?: string[]
}) {
  // Get the highest order number and add 1
  const highestOrder = await prisma.editorialBoardMember.findFirst({
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  })

  const order = data.order || (highestOrder ? highestOrder.order + 1 : 1)

  return prisma.editorialBoardMember.create({
    data: {
      ...data,
      order,
    },
  })
}

export async function updateEditorialBoardMember(
  id: string,
  data: {
    name?: string
    designation?: string
    image?: string
    order?: number
    bio?: string
    email?: string
    linkedin?: string
    orcid?: string
    detailedBio?: string
    expertise?: string[]
    education?: string[]
    achievements?: string[]
    publications?: string[]
  },
) {
  return prisma.editorialBoardMember.update({
    where: { id },
    data,
  })
}

export async function deleteEditorialBoardMember(id: string) {
  return prisma.editorialBoardMember.delete({
    where: { id },
  })
}

export async function reorderEditorialBoardMembers(orderedIds: string[]) {
  // Update the order of each member based on their position in the array
  const updates = orderedIds.map((id, index) => {
    return prisma.editorialBoardMember.update({
      where: { id },
      data: { order: index + 1 },
    })
  })

  return Promise.all(updates)
}
