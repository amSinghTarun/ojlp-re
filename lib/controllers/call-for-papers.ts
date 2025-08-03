// lib/controllers/call-for-paper.ts
import prisma from "@/lib/prisma"

export async function getCallsForPapers() {
  return prisma.callForPapers.findMany({
    orderBy: {
      deadline: "asc",
    },
  })
}

export async function getActiveCallsForPapers() {
  const now = new Date()

  return prisma.callForPapers.findMany({
    where: {
      deadline: {
        gt: now,
      },
    },
    orderBy: {
      deadline: "asc",
    },
  })
}

export async function getCallForPapersById(id: string) {
  return prisma.callForPapers.findUnique({
    where: { id },
  })
}

export async function createCallForPapers(data: {
  title: string
  thematicFocus: string
  description: string
  deadline: Date | string
  volume: number
  issue: number
  year: number
  publisher: string
  fee?: string
  topics?: string[]
  contentLink?: string
}) {
  return prisma.callForPapers.create({
    data: {
      title: data.title,
      thematicFocus: data.thematicFocus,
      description: data.description,
      deadline: data.deadline,
      volume: data.volume,
      issue: data.issue,
      year: data.year,
      publisher: data.publisher,
      fee: data.fee || null,
      topics: data.topics || [],
      contentLink: data.contentLink || null,
    },
  })
}

export async function updateCallForPapers(
  id: string,
  data: {
    title?: string
    thematicFocus?: string
    description?: string
    deadline?: Date | string
    volume?: number
    issue?: number
    year?: number
    publisher?: string
    fee?: string
    topics?: string[]
    contentLink?: string
  },
) {
  return prisma.callForPapers.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.thematicFocus !== undefined && { thematicFocus: data.thematicFocus }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.deadline !== undefined && { deadline: data.deadline }),
      ...(data.volume !== undefined && { volume: data.volume }),
      ...(data.issue !== undefined && { issue: data.issue }),
      ...(data.year !== undefined && { year: data.year }),
      ...(data.publisher !== undefined && { publisher: data.publisher }),
      ...(data.fee !== undefined && { fee: data.fee || null }),
      ...(data.topics !== undefined && { topics: data.topics }),
      ...(data.contentLink !== undefined && { contentLink: data.contentLink || null }),
    },
  })
}

export async function deleteCallForPapers(id: string) {
  return prisma.callForPapers.delete({
    where: { id },
  })
}