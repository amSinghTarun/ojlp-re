"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Users } from "lucide-react"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuthorProfile } from "@/components/author-profile"
import { MemberCard } from "@/components/member-card"
import { getEditorialBoard } from "@/lib/actions/editorial-board-actions"
import { BoardMemberType } from "@prisma/client"
import type { Author } from "@/lib/types"

type BoardAdvisor = {
  id: string
  name: string
  designation: string
  memberType: BoardMemberType
  image?: string
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

export default function BoardOfAdvisorsPage() {
  const [selectedAdvisor, setSelectedAdvisor] = useState<BoardAdvisor | null>(null)
  const [advisors, setAdvisors] = useState<BoardAdvisor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch advisors from database
  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getEditorialBoard()
        if (result.success && result.data) {
          // Filter to show only Advisors
          const advisorsOnly = result.data.filter(member => member.memberType === BoardMemberType.Advisor)
          setAdvisors(advisorsOnly)
          console.log("Fetched advisors:", advisorsOnly.length)
        } else {
          setError(result.error || "Failed to load board advisors")
        }
      } catch (err) {
        console.error("Failed to fetch board advisors:", err)
        setError("Failed to load board advisors")
      } finally {
        setLoading(false)
      }
    }

    fetchAdvisors()
  }, [])

  // Convert advisor to author format for AuthorProfile
  const getAuthorData = (advisor: BoardAdvisor): Author => ({
    id: advisor.id,
    name: advisor.name,
    email: advisor.email || "",
    slug: advisor.id,
    title: advisor.designation,
    bio: advisor.bio,
    detailedBio: advisor.detailedBio,
    image: advisor.image,
    expertise: advisor.expertise || [],
    education: advisor.education || [],
    achievements: advisor.achievements || [],
    publications: advisor.publications || [],
    location: advisor.location,
    affiliation: advisor.affiliation,
    website: advisor.website,
    socialLinks: {
      twitter: advisor.twitter,
      linkedin: advisor.linkedin,
      instagram: advisor.instagram,
      email: advisor.email,
    },
  })

  // Empty state component
  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No {type} Found</h3>
      <p className="text-muted-foreground">
        There are currently no {type.toLowerCase()} in the board of advisors.
      </p>
    </div>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container px-4 py-12 md:px-6">
            <div className="mb-8 animate-slide-up">
              <DecorativeHeading level={1}>Board of Advisors</DecorativeHeading>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                Our distinguished board of advisors provides strategic guidance and expertise to ensure the highest
                standards of legal scholarship.
              </p>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading board advisors...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container px-4 py-12 md:px-6">
            <div className="mb-8 animate-slide-up">
              <DecorativeHeading level={1}>Board of Advisors</DecorativeHeading>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                Our distinguished board of advisors provides strategic guidance and expertise to ensure the highest
                standards of legal scholarship.
              </p>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 px-2">
      <div className="max-w-5xl mx-auto text-center mt-4">
        <div className="mb-8 animate-slide-up justify-center pt-10 space-y-3">
            <h1 className="text-4xl sm:text-5xl text-center">Board of Advisors</h1>
            <p className="text-stone-600 text-sm font-normal justify-center align-middle content-center text-center max-w-4xl mx-auto">
              Our distinguished board of advisors provides strategic guidance and expertise to ensure the highest standards of academic excellence.
            </p>
          </div>

          {advisors.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 ">
              {advisors
                .sort((a, b) => a.order - b.order)
                .map((advisor, index) => (
                  <MemberCard
                    key={advisor.id}
                    member={advisor}
                    index={index}
                    onClick={setSelectedAdvisor}
                  />
                ))}
            </div>
          ) : (
            <EmptyState type="Board Advisors" />
          )}
        </div>
      </main>

     
    </div>
  )
}