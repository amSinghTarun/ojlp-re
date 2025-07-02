// lib/controllers/editorial-board.ts
'use server'

import prisma from "@/lib/prisma"
import { BoardMemberType } from "@prisma/client"

export async function getEditorialBoardMembers() {
  return prisma.editorialBoardMember.findMany({
    where: {
      archived: false,
    },
    orderBy: {
      order: "asc",
    },
  })
}

export async function getEditorialBoardMemberById(id: string) {
  return prisma.editorialBoardMember.findUnique({
    where: { 
      id,
      archived: false,
    },
  })
}

export async function createEditorialBoardMember(data: {
  name: string
  designation: string
  memberType: BoardMemberType
  image: string
  order?: number
  bio: string
  email?: string
  expertise?: string[]
  linkedin?: string
  orcid?: string
}) {
  // Get the highest order number and add 1 for the specific member type
  const highestOrder = await prisma.editorialBoardMember.findFirst({
    where: {
      memberType: data.memberType,
      archived: false,
    },
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
      email: data.email,
      expertise: data.expertise || [],
      linkedin: data.linkedin,
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
    email?: string
    expertise?: string[]
    linkedin?: string
    orcid?: string
  },
) {
  return prisma.editorialBoardMember.update({
    where: { id },
    data,
  })
}

export async function deleteEditorialBoardMember(id: string) {
  // Instead of hard delete, we archive the member
  return prisma.editorialBoardMember.update({
    where: { id },
    data: { archived: true },
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

export async function getEditorialBoardMembersByType(memberType: BoardMemberType) {
  return prisma.editorialBoardMember.findMany({
    where: { 
      memberType,
      archived: false,
    },
    orderBy: {
      order: "asc",
    },
  })
}

export async function getEditorialBoardStats() {
  const total = await prisma.editorialBoardMember.count({
    where: {
      archived: false,
    },
  })
  
  const editors = await prisma.editorialBoardMember.count({
    where: {
      memberType: BoardMemberType.Editor,
      archived: false,
    },
  })
  
  const advisors = await prisma.editorialBoardMember.count({
    where: {
      memberType: BoardMemberType.Advisor,
      archived: false,
    },
  })

  const archived = await prisma.editorialBoardMember.count({
    where: {
      archived: true,
    },
  })

  return {
    total,
    editors,
    advisors,
    archived,
  }
}

export async function searchEditorialBoardMembers(searchTerm: string) {
  return prisma.editorialBoardMember.findMany({
    where: {
      archived: false,
      OR: [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          designation: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          bio: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          expertise: {
            hasSome: [searchTerm],
          },
        },
      ],
    },
    orderBy: {
      order: "asc",
    },
  })
}

export async function restoreEditorialBoardMember(id: string) {
  return prisma.editorialBoardMember.update({
    where: { id },
    data: { archived: false },
  })
}

export async function getArchivedEditorialBoardMembers() {
  return prisma.editorialBoardMember.findMany({
    where: {
      archived: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })
}