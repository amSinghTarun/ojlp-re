import prisma from "../prisma"

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
  description: string
  deadline: Date | string
  guidelines?: string
  topics?: string[]
  eligibility?: string
  contact?: string
  volume?: number
  issue?: number
}) {
  return prisma.callForPapers.create({
    data,
  })
}

export async function updateCallForPapers(
  id: string,
  data: {
    title?: string
    description?: string
    deadline?: Date | string
    guidelines?: string
    topics?: string[]
    eligibility?: string
    contact?: string
    volume?: number
    issue?: number
  },
) {
  return prisma.callForPapers.update({
    where: { id },
    data,
  })
}

export async function deleteCallForPapers(id: string) {
  return prisma.callForPapers.delete({
    where: { id },
  })
}
