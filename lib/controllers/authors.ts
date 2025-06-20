// lib/controllers/authors.ts - FIXED
import { PrismaClient } from "@prisma/client"
import { slugify } from "../utils"

const prisma = new PrismaClient()

export async function getAuthors() {
  try {
    return await prisma.author.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        // UPDATED: Include articles through the new AuthorArticle junction
        authorArticles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
                type: true,
                draft: true,
                createdAt: true,
              }
            }
          },
          take: 5, // Limit to recent articles for performance
          orderBy: {
            article: {
              createdAt: 'desc'
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        // UPDATED: Include articles through the new AuthorArticle junction
        authorArticles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                image: true,
                type: true,
                draft: true,
                date: true,
                readTime: true,
                views: true,
                createdAt: true,
              }
            }
          },
          orderBy: {
            article: {
              createdAt: 'desc'
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
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
  image?: string
  expertise?: string[]
  education?: string[]
  socialLinks?: {
    twitter?: string
    linkedin?: string
    email?: string
    orcid?: string
  }
  userId?: string
}) {
  try {
    const { socialLinks, ...authorData } = data

    // Clean up the data - remove empty strings and undefined values
    const cleanData: any = {
      name: authorData.name.trim(),
      email: authorData.email.toLowerCase().trim(),
      slug: slugify(authorData.name),
      
      // Only include optional fields if they have actual values
      ...(authorData.title && authorData.title.trim() && { title: authorData.title.trim() }),
      ...(authorData.bio && authorData.bio.trim() && { bio: authorData.bio.trim() }),
      ...(authorData.image && authorData.image.trim() && { image: authorData.image.trim() }),
      ...(authorData.expertise && authorData.expertise.length > 0 && { expertise: authorData.expertise.filter(Boolean) }),
      ...(authorData.education && authorData.education.length > 0 && { education: authorData.education.filter(Boolean) }),
      
      // Handle social links - only include if they have values
      ...(socialLinks?.twitter && socialLinks.twitter.trim() && { twitter: socialLinks.twitter.trim() }),
      ...(socialLinks?.linkedin && socialLinks.linkedin.trim() && { linkedin: socialLinks.linkedin.trim() }),
      ...(socialLinks?.email && socialLinks.email.trim() && { socialEmail: socialLinks.email.trim() }),
      ...(socialLinks?.orcid && socialLinks.orcid.trim() && { orcid: socialLinks.orcid.trim() }),
      
      // Only include userId if it's provided and not empty
      ...(authorData.userId && authorData.userId.trim() && { userId: authorData.userId.trim() }),
    }

    console.log("🔧 Creating author with cleaned data:", cleanData)

    const author = await prisma.author.create({
      data: cleanData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    console.log("✅ Author created successfully:", author.name)
    return author
  } catch (error) {
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
    image?: string
    expertise?: string[]
    education?: string[]
    socialLinks?: {
      twitter?: string
      linkedin?: string
      email?: string
      orcid?: string
    }
    userId?: string
  }
) {
  try {
    const { socialLinks, ...authorData } = data

    // Clean up the data - remove empty strings and undefined values
    const cleanData: any = {}

    if (authorData.name && authorData.name.trim()) {
      cleanData.name = authorData.name.trim()
      cleanData.slug = slugify(authorData.name) // Update slug if name changes
    }
    
    if (authorData.email && authorData.email.trim()) {
      cleanData.email = authorData.email.toLowerCase().trim()
    }

    // Handle optional fields - only update if provided
    if (authorData.title !== undefined) {
      cleanData.title = authorData.title.trim() || null
    }
    
    if (authorData.bio !== undefined) {
      cleanData.bio = authorData.bio.trim() || null
    }
    
    if (authorData.image !== undefined) {
      cleanData.image = authorData.image.trim() || null
    }
    
    if (authorData.expertise !== undefined) {
      cleanData.expertise = authorData.expertise.filter(Boolean)
    }
    
    if (authorData.education !== undefined) {
      cleanData.education = authorData.education.filter(Boolean)
    }

    // Handle social links
    if (socialLinks?.twitter !== undefined) {
      cleanData.twitter = socialLinks.twitter.trim() || null
    }
    
    if (socialLinks?.linkedin !== undefined) {
      cleanData.linkedin = socialLinks.linkedin.trim() || null
    }
    
    if (socialLinks?.email !== undefined) {
      cleanData.socialEmail = socialLinks.email.trim() || null
    }
    
    if (socialLinks?.orcid !== undefined) {
      cleanData.orcid = socialLinks.orcid.trim() || null
    }

    if (authorData.userId !== undefined) {
      cleanData.userId = authorData.userId.trim() || null
    }

    console.log("🔧 Updating author with cleaned data:", cleanData)

    const author = await prisma.author.update({
      where: { slug },
      data: cleanData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    console.log("✅ Author updated successfully:", author.name)
    return author
  } catch (error) {
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
  } catch (error) {
    console.error("💥 Error deleting author:", error)
    
    if (error.code === 'P2025') {
      throw new Error("Author not found")
    }
    
    throw new Error(`Failed to delete author: ${error.message}`)
  }
}