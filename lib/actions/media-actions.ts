"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { uploadImage, deleteImage } from "@/lib/supabase"
import prisma from "@/lib/prisma"

// Helper function to get current user with permissions
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

// Helper function to validate file type and size
function validateFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 10MB.'
    }
  }

  return { isValid: true }
}

export async function uploadMediaFile(formData: FormData) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create media files
    const permissionCheck = checkPermission(currentUser, 'media.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to upload media files" 
      }
    }

    const file = formData.get('file') as File
    const alt = formData.get('alt') as string
    const description = formData.get('description') as string
    
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file
    const fileValidation = validateFile(file)
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error }
    }

    // Check for duplicate filename (optional - you might want to allow this)
    const existingMedia = await prisma.media.findFirst({
      where: { name: file.name }
    })

    if (existingMedia) {
      console.warn(`⚠️ File with name ${file.name} already exists`)
      // You might want to auto-rename or warn user
    }

    // Upload to Supabase
    console.log(`📤 User ${currentUser.email} uploading file: ${file.name} (${file.size} bytes)`)
    const uploadResult = await uploadImage(file, 'images', 'editorial-board')
    
    if (!uploadResult) {
      return { success: false, error: "Failed to upload image to storage" }
    }

    // Save to database with user context
    const media = await prisma.media.create({
      data: {
        name: file.name,
        url: uploadResult.url,
        type: file.type,
        size: file.size,
        alt: alt || file.name,
        description: description || null,
        uploadedBy: currentUser.id, // Track who uploaded the file
      }
    })

    console.log(`✅ User ${currentUser.email} uploaded media file: ${media.name} (ID: ${media.id})`)

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
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid media file ID provided" }
    }

    // Get the media file from database to check ownership
    const media = await prisma.media.findUnique({
      where: { id }
    })

    if (!media) {
      return { success: false, error: "Media file not found" }
    }

    // Check if user has permission to delete media files
    const isOwner = media.uploadedBy === currentUser.id
    
    const permissionCheck = checkPermission(currentUser, 'media.DELETE')

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to delete this media file" 
      }
    }

    // Check if media is being used elsewhere (optional safety check)
    const usageCheck = await checkMediaUsage(id)
    if (usageCheck.isUsed) {
      return { 
        success: false, 
        error: `Cannot delete media file. It is currently being used in: ${usageCheck.usedIn.join(', ')}` 
      }
    }

    // Extract path from URL for Supabase deletion
    const urlParts = media.url.split('/')
    const bucketIndex = urlParts.findIndex(part => part === 'images')
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      const path = urlParts.slice(bucketIndex + 1).join('/')
      console.log(`🗑️ Deleting from storage: ${path}`)
      await deleteImage(path, 'images')
    }

    // Delete from database
    await prisma.media.delete({
      where: { id }
    })

    console.log(`✅ User ${currentUser.email} deleted media file: ${media.name} (ID: ${media.id})`)

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
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read media files
    const permissionCheck = checkPermission(currentUser, 'media.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to view media files" 
      }
    }

    const media = await prisma.media.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ User ${currentUser.email} fetched ${media.length} media files`)

    return { success: true, data: media }
  } catch (error) {
    console.error('Failed to fetch media:', error)
    return { success: false, error: "Failed to fetch media files" }
  }
}

// NEW: Function to get media files with permission context
export async function getMediaFilesWithPermissions() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read media files
    const permissionCheck = checkPermission(currentUser, 'media.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: "You don't have permission to view media files" 
      }
    }

    const media = await prisma.media.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add permission context to each media file
    const mediaWithPermissions = media.map(file => {
      const isOwner = file.uploadedBy === currentUser.id
      
      return {
        ...file,
        canEdit: checkPermission(currentUser, 'media.UPDATE').allowed,
        canDelete: checkPermission(currentUser, 'media.DELETE').allowed,
      }
    })

    return { 
      success: true, 
      data: mediaWithPermissions,
      canUpload: checkPermission(currentUser, 'media.CREATE').allowed
    }
  } catch (error) {
    console.error('Failed to fetch media files with permissions:', error)
    return { success: false, error: "Failed to fetch media files" }
  }
}

// NEW: Function to update media file metadata
export async function updateMediaFile(id: string, data: { alt?: string; description?: string; name?: string }) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: "Invalid media file ID provided" }
    }

    // Get the existing media file
    const existingMedia = await prisma.media.findUnique({
      where: { id }
    })

    if (!existingMedia) {
      return { success: false, error: "Media file not found" }
    }

    // Check if user has permission to update media files
    const isOwner = existingMedia.uploadedBy === currentUser.id
    
    const permissionCheck = checkPermission(currentUser, 'media.UPDATE')

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to update this media file" 
      }
    }

    // Update the media file
    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        ...(data.alt !== undefined && { alt: data.alt }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.name !== undefined && { name: data.name }),
      }
    })

    console.log(`✅ User ${currentUser.email} updated media file: ${updatedMedia.name} (ID: ${updatedMedia.id})`)

    revalidatePath('/admin/media')
    revalidatePath('/admin/editorial-board')

    return { success: true, data: updatedMedia }
  } catch (error) {
    console.error('Failed to update media file:', error)
    return { success: false, error: "Failed to update media file" }
  }
}

// NEW: Function to check media permissions
export async function checkMediaPermissions(mediaId?: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { 
        success: false, 
        error: "Authentication required",
        permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
      }
    }

    let permissions = {
      canRead: checkPermission(currentUser, 'media.READ').allowed,
      canCreate: checkPermission(currentUser, 'media.CREATE').allowed,
      canUpdate: false,
      canDelete: false,
    }

    // If specific media ID is provided, check update/delete permissions
    if (mediaId) {
      const media = await prisma.media.findUnique({
        where: { id: mediaId }
      })

      if (media) {
        const isOwner = media.uploadedBy === currentUser.id
        
        permissions.canUpdate = checkPermission(currentUser, 'media.UPDATE').allowed

        permissions.canDelete = checkPermission(currentUser, 'media.DELETE').allowed
      }
    }

    return { success: true, permissions }
  } catch (error) {
    console.error("Failed to check media permissions:", error)
    return { 
      success: false, 
      error: "Failed to check permissions",
      permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false }
    }
  }
}

// Helper function to check if media is being used elsewhere
async function checkMediaUsage(mediaId: string): Promise<{ isUsed: boolean; usedIn: string[] }> {
  try {
    const usedIn: string[] = []

    // Check if used in articles
    const articlesUsingMedia = await prisma.article.findMany({
      where: { 
        OR: [
          { image: { contains: mediaId } },
          { images: { has: mediaId } }
        ]
      },
      select: { id: true, title: true }
    })

    if (articlesUsingMedia.length > 0) {
      usedIn.push(`${articlesUsingMedia.length} article(s)`)
    }

    // Check if used in editorial board members
    const boardMembersUsingMedia = await prisma.editorialBoardMember.findMany({
      where: { image: { contains: mediaId } },
      select: { id: true, name: true }
    })

    if (boardMembersUsingMedia.length > 0) {
      usedIn.push(`${boardMembersUsingMedia.length} board member(s)`)
    }

    // Check if used in authors
    const authorsUsingMedia = await prisma.author.findMany({
      where: { image: { contains: mediaId } },
      select: { id: true, name: true }
    })

    if (authorsUsingMedia.length > 0) {
      usedIn.push(`${authorsUsingMedia.length} author(s)`)
    }

    // Check if used in call for papers
    const callsUsingMedia = await prisma.callForPapers.findMany({
      where: { image: { contains: mediaId } },
      select: { id: true, title: true }
    })

    if (callsUsingMedia.length > 0) {
      usedIn.push(`${callsUsingMedia.length} call for papers`)
    }

    return {
      isUsed: usedIn.length > 0,
      usedIn
    }
  } catch (error) {
    console.error('Error checking media usage:', error)
    return { isUsed: false, usedIn: [] }
  }
}