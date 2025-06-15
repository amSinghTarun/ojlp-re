"use client"

import { useState } from "react"
import Image from "next/image"
import { Mail, Linkedin, X } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { editorialBoardMembers } from "@/lib/editorial-board"
import { AuthorProfile } from "@/components/author-profile"
import type { Author } from "@/lib/types"

export default function EditorialBoardPage() {
  const [selectedMember, setSelectedMember] = useState<null | (typeof editorialBoardMembers)[0]>(null)

  // Sort members by their order property
  const sortedMembers = [...editorialBoardMembers].sort((a, b) => a.order - b.order)

  // Convert board member to author format for AuthorProfile
  const getAuthorData = (member: (typeof editorialBoardMembers)[0]): Author => ({
    id: member.id,
    name: member.name,
    slug: member.id.toString(),
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedMembers.map((member, index) => (
              <ScrollReveal key={member.id} delay={index * 100}>
                <Card
                  className="overflow-hidden law-card ornamental-corners animate-fade-in h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-md"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-4 border-b border-muted">
                    <div className="space-y-1">
                      <h3 className="font-bold text-xl line-clamp-2">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.designation}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-3 flex-grow">
                    <p className="text-muted-foreground line-clamp-4">{member.bio}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t border-muted mt-auto">
                    <div className="flex items-center justify-center w-full gap-2">
                      {member.email && (
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full">
                          <a
                            href={`mailto:${member.email}`}
                            aria-label={`Email ${member.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}

                      {member.linkedin && (
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full">
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`LinkedIn profile of ${member.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}

                      {member.orcid && (
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full">
                          <a
                            href={`https://orcid.org/${member.orcid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`ORCID profile of ${member.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg viewBox="0 0 256 256" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                              <path
                                d="M128 0C57.3 0 0 57.3 0 128s57.3 128 128 128 128-57.3 128-128S198.7 0 128 0z"
                                fill="#A6CE39"
                              />
                              <path
                                d="M86.3 186.2H70.9V79.1h15.4v107.1zm22.6-107.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7C191.7 108.2 174 93 142.3 93h-18v79.4zM88.7 56.8c0 5.5-4.5 10.1-10.1 10.1s-10.1-4.6-10.1-10.1c0-5.6 4.5-10.1 10.1-10.1s10.1 4.6 10.1 10.1z"
                                fill="#FFFFFF"
                              />
                            </svg>
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </ScrollReveal>
            ))}
          </div>
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
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-auto rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-background z-10">
              <h2 className="text-xl font-serif">{selectedMember.name}</h2>
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
              <AuthorProfile author={getAuthorData(selectedMember)} articleCount={0} detailed={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
