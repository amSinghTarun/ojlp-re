"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Mail, Linkedin, X, Loader2 } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuthorProfile } from "@/components/author-profile"
import { getEditorialBoard } from "@/lib/actions/editorial-board-actions"
import { BoardMemberType } from "@prisma/client"
import type { Author } from "@/lib/types"

type EditorialBoardMember = {
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

export default function EditorialBoardPage() {
  const [selectedMember, setSelectedMember] = useState<EditorialBoardMember | null>(null)
  const [members, setMembers] = useState<EditorialBoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch members from database
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true)
        const result = await getEditorialBoard()
        if (result.success) {
          // Filter to show only Editors
          const editors = result.data.filter(member => member.memberType === BoardMemberType.Editor)
          setMembers(editors)
        } else {
          setError(result.error as string)
        }
      } catch (err) {
        console.error("Failed to fetch editorial board members:", err)
        setError("Failed to load editorial board members")
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  // Sort members by their order property
  const sortedMembers = [...members].sort((a, b) => a.order - b.order)

  // Convert board member to author format for AuthorProfile
  const getAuthorData = (member: EditorialBoardMember): Author => ({
    id: member.id,
    email: member.email || "",
    name: member.name,
    slug: member.id,
    title: member.designation,
    bio: member.bio,
    detailedBio: member.detailedBio,
    image: member.image,
    expertise: member.expertise || [],
    education: member.education || [],
    achievements: member.achievements || [],
    publications: member.publications || [],
    location: member.location,
    affiliation: member.affiliation,
    website: member.website,
    socialLinks: {
      twitter: member.twitter,
      linkedin: member.linkedin,
      instagram: member.instagram,
      email: member.email,
    },
  })

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container px-4 py-12 md:px-6">
            <div className="mb-8 animate-slide-up">
              <DecorativeHeading level={1}>Editorial Board</DecorativeHeading>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                Meet the distinguished scholars and legal experts who guide our publications.
              </p>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading editorial board members...</p>
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
              <DecorativeHeading level={1}>Editorial Board</DecorativeHeading>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                Meet the distinguished scholars and legal experts who guide our publications.
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
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8 animate-slide-up">
            <DecorativeHeading level={1}>Editorial Board</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Meet the distinguished scholars and legal experts who guide our publications and maintain the highest standards of academic excellence.
            </p>
          </div>

          {sortedMembers.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {sortedMembers.map((member, index) => (
                <ScrollReveal key={member.id} delay={index * 100}>
                  <div
                    className="border rounded-lg overflow-hidden bg-card cursor-pointer transition-all duration-300 hover:shadow-md"
                  >
                    {member.image ? (
                      <div className="relative h-48 w-full">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative h-48 w-full flex items-center justify-center bg-muted">
                        <div className="text-center">
                          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xl font-semibold text-primary">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-xl font-bold font-serif">{member.name}</h2>
                      <p className="text-muted-foreground mb-2">{member.designation}</p>
                      {member.affiliation && (
                        <p className="text-sm text-muted-foreground mb-4">{member.affiliation}</p>
                      )}

                      {member.bio && <p className="text-sm mb-4 line-clamp-3">{member.bio}</p>}

                      {member.expertise && member.expertise.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold mb-2">Areas of Expertise</h3>
                          <div className="flex flex-wrap gap-2">
                            {member.expertise.slice(0, 3).map((area) => (
                              <Badge key={area} variant="secondary">
                                {area}
                              </Badge>
                            ))}
                            {member.expertise.length > 3 && (
                              <Badge variant="outline">+{member.expertise.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Social Links */}
                      <div className="mt-4 pt-3 border-t flex items-center gap-2">
                        {member.email && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <a
                              href={`mailto:${member.email}`}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Email ${member.name}`}
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}

                        {member.linkedin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`LinkedIn profile of ${member.name}`}
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                          </Button>
                        )}

                        {member.orcid && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <a
                              href={`https://orcid.org/${member.orcid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`ORCID profile of ${member.name}`}
                            >
                              <svg viewBox="0 0 256 256" className="h-4 w-4" aria-hidden="true">
                                <path
                                  d="M128 0C57.3 0 0 57.3 0 128s57.3 128 128 128 128-57.3 128-128S198.7 0 128 0z"
                                  fill="#A6CE39"
                                />
                                <path
                                  d="M86.3 186.2H70.9V79.1h15.4v107.1zm22.6-107.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7C191.7 111.2 178 93 148 93h-23.7v79.4zM88.7 56.8c0 5.5-4.5 10.1-10.1 10.1s-10.1-4.6-10.1-10.1c0-5.6 4.5-10.1 10.1-10.1s10.1 4.6 10.1 10.1z"
                                  fill="#FFF"
                                />
                              </svg>
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No editorial board members found.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedMember(null)}
            aria-hidden="true"
          />

          {/* Modal content */}
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-auto rounded-lg border bg-background shadow-lg mx-4">
            <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-background z-10">
              <div>
                <h2 className="text-xl font-serif">{selectedMember.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Editorial Board
                  </Badge>
                  {selectedMember.affiliation && (
                    <span className="text-sm text-muted-foreground">
                      {selectedMember.affiliation}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMember(null)}
                className="ml-auto"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <AuthorProfile 
                author={getAuthorData(selectedMember)} 
                articleCount={0} 
                detailed={true} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}