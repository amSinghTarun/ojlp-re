// lib/controllers/media.ts
import prisma from "@/lib/prisma"

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
  size: number
  alt?: string
  description?: string
  uploadedBy?: string
}) {
  return prisma.media.create({
    data: {
      name: data.name,
      url: data.url,
      type: data.type,
      size: data.size,
      alt: data.alt || null,
      description: data.description || null,
      uploadedBy: data.uploadedBy || null,
    },
  })
}

export async function updateMedia(
  id: string,
  data: {
    name?: string
    alt?: string
    description?: string
    // Removed width and height as they're not in the schema
  },
) {
  return prisma.media.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.alt !== undefined && { alt: data.alt || null }),
      ...(data.description !== undefined && { description: data.description || null }),
    },
  })
}

export async function deleteMedia(id: string) {
  return prisma.media.delete({
    where: { id },
  })
}

// Additional helper functions that might be useful
export async function getMediaByType(type: string) {
  return prisma.media.findMany({
    where: { type },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getMediaByUploader(uploadedBy: string) {
  return prisma.media.findMany({
    where: { uploadedBy },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getMediaCount(type?: string) {
  const where = type ? { type } : {}
  
  return prisma.media.count({
    where,
  })
}

export async function searchMedia(query: string) {
  return prisma.media.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          alt: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}