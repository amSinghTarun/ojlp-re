import prisma from "@/lib/prisma"
import { BoardMemberType } from "@prisma/client"

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
  memberType: BoardMemberType
  image: string
  order?: number
  bio?: string
  detailedBio?: string
  email?: string
  expertise?: string[]
  education?: string[]
  achievements?: string[]
  publications?: string[]
  location?: string
  affiliation?: string
  website?: string
  twitter?: string
  linkedin?: string
  instagram?: string
  orcid?: string
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
      name: data.name,
      designation: data.designation,
      memberType: data.memberType,
      image: data.image,
      order,
      bio: data.bio,
      detailedBio: data.detailedBio,
      email: data.email,
      expertise: data.expertise || [],
      education: data.education || [],
      achievements: data.achievements || [],
      publications: data.publications || [],
      location: data.location,
      affiliation: data.affiliation,
      website: data.website,
      twitter: data.twitter,
      linkedin: data.linkedin,
      instagram: data.instagram,
      orcid: data.orcid,
    },
  })
}

export async function updateEditorialBoardMember(
  id: string,
  data: {
    name?: string
    designation?: string
    memberType?: BoardMemberType
    image?: string
    order?: number
    bio?: string
    detailedBio?: string
    email?: string
    expertise?: string[]
    education?: string[]
    achievements?: string[]
    publications?: string[]
    location?: string
    affiliation?: string
    website?: string
    twitter?: string
    linkedin?: string
    instagram?: string
    orcid?: string
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