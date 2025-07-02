// lib/controllers/authors.ts - Updated for actual schema
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export async function getAuthors() {
  try {
    return await prisma.author.findMany({
      include: {
        authorArticles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
                type: true,
                publishedAt: true,
              }
            }
          },
          take: 5,
          orderBy: {
            article: {
              publishedAt: 'desc'
            }
          }
        },
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error("Error fetching authors:", error)
    throw new Error("Failed to fetch authors")
  }
}

export async function getAuthorBySlug(slug: string) {
  try {
    return await prisma.author.findUnique({
      where: { slug },
      include: {
        authorArticles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
                abstract: true,
                image: true,
                type: true,
                readTime: true,
                views: true,
                publishedAt: true,
              }
            }
          },
          orderBy: {
            article: {
              publishedAt: 'desc'
            }
          }
        },
      },
    })
  } catch (error) {
    console.error("Error fetching author by slug:", error)
    throw new Error("Failed to fetch author")
  }
}

export async function getAuthorById(id: string) {
  try {
    return await prisma.author.findUnique({
      where: { id },
    })
  } catch (error) {
    console.error("Error fetching author by ID:", error)
    throw new Error("Failed to fetch author")
  }
}

export async function createAuthor(data: {
  name: string
  email: string
  title?: string
  bio?: string
}) {
  try {
    // Clean up the data - only use fields that exist in schema
    const cleanData = {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      slug: slugify(data.name.trim()), // Generate slug from name
      
      // Only include optional fields if they have actual values
      ...(data.title && data.title.trim() && { title: data.title.trim() }),
      ...(data.bio && data.bio.trim() && { bio: data.bio.trim() }),
    }

    console.log("🔧 Creating author with cleaned data:", cleanData)

    const author = await prisma.author.create({
      data: cleanData,
    })

    console.log("✅ Author created successfully:", author.name)
    return author
  } catch (error: any) {
    console.error("💥 Error creating author:", error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      const target = error.meta?.target
      if (target?.includes('email')) {
        throw new Error("An author with this email already exists")
      }
      if (target?.includes('slug')) {
        throw new Error("An author with this name already exists")
      }
      throw new Error("This author information already exists")
    }
    
    throw new Error(`Failed to create author: ${error.message}`)
  }
}

export async function updateAuthor(
  slug: string,
  data: {
    name?: string
    email?: string
    title?: string
    bio?: string
  }
) {
  try {
    // Clean up the data - only use fields that exist in schema
    const cleanData: any = {}

    if (data.name && data.name.trim()) {
      cleanData.name = data.name.trim()
      cleanData.slug = slugify(data.name.trim()) // Update slug if name changes
    }
    
    if (data.email && data.email.trim()) {
      cleanData.email = data.email.toLowerCase().trim()
    }

    // Handle optional fields - only update if provided
    if (data.title !== undefined) {
      cleanData.title = data.title?.trim() || null
    }
    
    if (data.bio !== undefined) {
      cleanData.bio = data.bio?.trim() || null
    }

    console.log("🔧 Updating author with cleaned data:", cleanData)

    const author = await prisma.author.update({
      where: { slug },
      data: cleanData,
    })

    console.log("✅ Author updated successfully:", author.name)
    return author
  } catch (error: any) {
    console.error("💥 Error updating author:", error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      const target = error.meta?.target
      if (target?.includes('email')) {
        throw new Error("Another author with this email already exists")
      }
      if (target?.includes('slug')) {
        throw new Error("Another author with this name already exists")
      }
      throw new Error("This author information conflicts with existing data")
    }
    
    if (error.code === 'P2025') {
      throw new Error("Author not found")
    }
    
    throw new Error(`Failed to update author: ${error.message}`)
  }
}

export async function deleteAuthor(slug: string) {
  try {
    // Check if author has articles
    const author = await prisma.author.findUnique({
      where: { slug },
      include: {
        authorArticles: {
          select: {
            id: true
          }
        }
      }
    })

    if (!author) {
      throw new Error("Author not found")
    }

    if (author.authorArticles.length > 0) {
      throw new Error("Cannot delete author with existing articles. Please reassign or delete the articles first.")
    }

    await prisma.author.delete({
      where: { slug },
    })

    console.log("✅ Author deleted successfully:", author.name)
    return { success: true }
  } catch (error: any) {
    console.error("💥 Error deleting author:", error)
    
    if (error.code === 'P2025') {
      throw new Error("Author not found")
    }
    
    throw new Error(`Failed to delete author: ${error.message}`)
  }
}