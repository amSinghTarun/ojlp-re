"use server"

import { revalidatePath } from "next/cache"
import { uploadImage, deleteImage } from "@/lib/supabase"
import prisma from "@/lib/prisma"

export async function uploadMediaFile(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string
    const description = formData.get('description') as string
    
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Upload to Supabase
    const uploadResult = await uploadImage(file, 'images', 'editorial-board')
    
    if (!uploadResult) {
      return { success: false, error: "Failed to upload image" }
    }

    // Save to database
    const media = await prisma.media.create({
      data: {
        name: file.name,
        url: uploadResult.url,
        type: file.type,
        size: file.size,
        alt: alt || file.name,
        description: description || null,
        // Note: You may want to add uploadedBy field if you have user authentication
      }
    })

    revalidatePath('/admin/media')
    revalidatePath('/admin/editorial-board')

    return { success: true, data: media }
  } catch (error) {
    console.error('Failed to upload media:', error)
    return { success: false, error: "Failed to upload media file" }
  }
}

export async function deleteMediaFile(id: string) {
  try {
    // Get the media file from database
    const media = await prisma.media.findUnique({
      where: { id }
    })

    if (!media) {
      return { success: false, error: "Media file not found" }
    }

    // Extract path from URL for Supabase deletion
    const urlParts = media.url.split('/')
    const bucketIndex = urlParts.findIndex(part => part === 'images')
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      const path = urlParts.slice(bucketIndex + 1).join('/')
      await deleteImage(path, 'images')
    }

    // Delete from database
    await prisma.media.delete({
      where: { id }
    })

    revalidatePath('/admin/media')
    revalidatePath('/admin/editorial-board')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete media:', error)
    return { success: false, error: "Failed to delete media file" }
  }
}

export async function getMediaFiles() {
  try {
    const media = await prisma.media.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, data: media }
  } catch (error) {
    console.error('Failed to fetch media:', error)
    return { success: false, error: "Failed to fetch media files" }
  }
}