"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Mail, Linkedin } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { boardAdvisors } from "@/lib/board-advisors"
import { AuthorProfile } from "@/components/author-profile"
import type { Author } from "@/lib/types"

export default function BoardOfAdvisorsPage() {
  const [selectedAdvisor, setSelectedAdvisor] = useState<null | (typeof boardAdvisors)[0]>(null)

  // Convert advisor to author format for AuthorProfile
  const getAuthorData = (advisor: (typeof boardAdvisors)[0]): Author => ({
    id: advisor.id,
    name: advisor.name,
    slug: advisor.id.toString(),
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

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {boardAdvisors
              .sort((a, b) => a.order - b.order)
              .map((advisor) => (
                <ScrollReveal key={advisor.id}>
                  <div
                    className="border rounded-lg overflow-hidden bg-card cursor-pointer transition-all duration-300 hover:shadow-md"
                    onClick={() => setSelectedAdvisor(advisor)}
                  >
                    {advisor.image && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={advisor.image || "/placeholder.svg"}
                          alt={advisor.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-xl font-bold font-serif">{advisor.name}</h2>
                      <p className="text-muted-foreground mb-4">{advisor.designation}</p>

                      {advisor.bio && <p className="text-sm mb-4 line-clamp-3">{advisor.bio}</p>}

                      {advisor.expertise && advisor.expertise.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold mb-2">Areas of Expertise</h3>
                          <div className="flex flex-wrap gap-2">
                            {advisor.expertise.slice(0, 3).map((area) => (
                              <Badge key={area} variant="secondary">
                                {area}
                              </Badge>
                            ))}
                            {advisor.expertise.length > 3 && (
                              <Badge variant="outline">+{advisor.expertise.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Social Links */}
                      <div className="mt-4 pt-3 border-t flex items-center gap-2">
                        {advisor.email && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <Link
                              href={`mailto:${advisor.email}`}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Email ${advisor.name}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}

                        {advisor.linkedin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <Link
                              href={advisor.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`LinkedIn profile of ${advisor.name}`}
                            >
                              <Linkedin className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}

                        {advisor.orcid && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <Link
                              href={`https://orcid.org/${advisor.orcid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`ORCID profile of ${advisor.name}`}
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
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
          </div>
        </div>
      </main>

      {/* Modal */}
      {selectedAdvisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedAdvisor(null)}
            aria-hidden="true"
          />

          {/* Modal content */}
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-auto rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-background z-10">
              <h2 className="text-xl font-serif">{selectedAdvisor.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAdvisor(null)}
                className="ml-auto"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <AuthorProfile author={getAuthorData(selectedAdvisor)} articleCount={0} detailed={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
