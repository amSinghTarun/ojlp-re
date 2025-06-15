import prisma from "../prisma"

export async function getMediaItems(params?: {
  type?: string
  limit?: number
  offset?: number
}) {
  const { type, limit, offset = 0 } = params || {}

  const where = type ? { type } : {}

  return prisma.media.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: offset,
    take: limit,
  })
}

export async function getMediaById(id: string) {
  return prisma.media.findUnique({
    where: { id },
  })
}

export async function createMedia(data: {
  name: string
  url: string
  type: string
  size?: number
  alt?: string
  width?: number
  height?: number
  userId?: string
}) {
  return prisma.media.create({
    data,
  })
}

export async function updateMedia(
  id: string,
  data: {
    name?: string
    alt?: string
    width?: number
    height?: number
  },
) {
  return prisma.media.update({
    where: { id },
    data,
  })
}

export async function deleteMedia(id: string) {
  return prisma.media.delete({
    where: { id },
  })
}
