// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Upload image to Supabase storage
export async function uploadImage(
  file: File,
  bucket: string = 'images',
  folder?: string
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload file with public access
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('Error uploading file:', error)
      throw error
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      url: publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Delete image from Supabase storage
export async function deleteImage(
  path: string,
  bucket: string = 'images'
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Error deleting file:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

// Get all images from a bucket/folder
export async function listImages(
  bucket: string = 'images',
  folder?: string
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Error listing files:', error)
      return []
    }

    return data.map(file => ({
      name: file.name,
      url: supabase.storage.from(bucket).getPublicUrl(folder ? `${folder}/${file.name}` : file.name).data.publicUrl,
      path: folder ? `${folder}/${file.name}` : file.name,
      size: file.metadata?.size || 0,
      created_at: file.created_at
    }))
  } catch (error) {
    console.error('Error listing images:', error)
    return []
  }
}