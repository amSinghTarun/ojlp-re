export interface Article {
  slug: string
  title: string
  // Replace single author with authors array
  authors: Author[]
  // Keep these fields for backward compatibility
  author?: string
  authorSlug?: string
  date: string
  readTime: number
  image: string
  excerpt: string
  content: string
  type: "blog" | "journal"
  draft?: boolean
  views?: number
  images?: string[]
  doi?: string
  volume?: number
  issue?: number
  year?: number
  categories?: string[] // Keep for backward compatibility
  keywords?: string[] // Add new field for keywords
}

// Update the User interface to include role
export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR" | "VIEWER"
  permissions?: string[]
}

// Update the Author interface to include userId and make most fields optional
export interface Author {
  id?: string
  slug: string
  name: string
  email: string // Required field
  title?: string
  bio?: string
  detailedBio?: string
  image?: string
  expertise?: string[]
  education?: string[]
  achievements?: string[]
  publications?: string[]
  location?: string
  affiliation?: string
  website?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    instagram?: string
    email?: string
  }
  userId?: string // Link to User
  orcid?: string
}

export interface EditorialBoardMember {
  id: string
  name: string
  designation: string
  image: string
  order: number
  bio?: string
  detailedBio?: string
  email?: string
  achievements?: string[]
  publications?: string[]
  expertise?: string[]
  education?: string[]
  location?: string
  affiliation?: string
  website?: string
  twitter?: string
  linkedin?: string
  instagram?: string
  orcid?: string
}

export interface BoardAdvisor {
  id: string
  name: string
  designation: string
  image: string
  order: number
  bio?: string
  detailedBio?: string
  email?: string
  expertise?: string[]
  education?: string[]
  achievements?: string[]
  publications?: string[]
  location?: string
  affiliation?: string
  website?: string
  twitter?: string
  linkedin?: string
  instagram?: string
  orcid?: string
}

export interface Notification {
  id: string
  title: string
  content: string
  date: string
  type:
    | "call-for-papers"
    | "student-competition"
    | "editorial-vacancy"
    | "special-issue"
    | "event"
    | "announcement"
    | "publication"
  priority: "low" | "medium" | "high"
  read: boolean
  link?: string
  expiresAt?: string
  image?: string
}

export interface JournalIssue {
  id: string
  volume: number
  issue: number
  year: number
  title: string
  description: string
  coverImage: string
  publishDate: string
  articles?: string[] // Make articles array optional
}

export interface CallForPapers {
  id: string
  title: string
  thematicFocus: string
  description: string
  deadline: string
  volume: number
  issue: number
  year: number
  guidelines: string
  fee?: string
  image?: string
}

export interface JournalVolume {
  id: string
  number: number
  title: string
  year: number
  issueCount: number
  issues: JournalIssue[]
}
