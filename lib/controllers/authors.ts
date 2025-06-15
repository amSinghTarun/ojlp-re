import prisma from "../prisma"
import { slugify } from "../utils"

export async function getAuthors() {
  return prisma.author.findMany({
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
}

export async function getAuthorBySlug(slug: string) {
  return prisma.author.findUnique({
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
      articles: {
        include: {
          article: true,
        },
      },
    },
  })
}

export async function getAuthorById(id: string) {
  return prisma.author.findUnique({
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
  const { socialLinks, ...authorData } = data

  return prisma.author.create({
    data: {
      ...authorData,
      slug: slugify(data.name),
      socialTwitter: socialLinks?.twitter,
      socialLinkedin: socialLinks?.linkedin,
      socialEmail: socialLinks?.email,
      socialOrcid: socialLinks?.orcid,
    },
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
  },
) {
  const { socialLinks, ...authorData } = data

  // If name is updated, update slug as well
  if (data.name) {
    authorData.slug = slugify(data.name)
  }

  // Update social links if provided
  if (socialLinks) {
    if (socialLinks.twitter !== undefined) authorData.socialTwitter = socialLinks.twitter
    if (socialLinks.linkedin !== undefined) authorData.socialLinkedin = socialLinks.linkedin
    if (socialLinks.email !== undefined) authorData.socialEmail = socialLinks.email
    if (socialLinks.orcid !== undefined) authorData.socialOrcid = socialLinks.orcid
  }

  return prisma.author.update({
    where: { slug },
    data: authorData,
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
}

export async function deleteAuthor(slug: string) {
  return prisma.author.delete({
    where: { slug },
  })
}

export async function getAuthorArticles(authorId: string) {
  return prisma.articleAuthor.findMany({
    where: {
      authorId,
    },
    include: {
      article: {
        include: {
          authors: {
            include: {
              author: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  })
}
