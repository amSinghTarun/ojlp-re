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

type EditorialBoardMember = {
  id: string
  name: string
  designation: string
  memberType: BoardMemberType
  image?: string
  order: number
  bio?: string
  email?: string
  expertise?: string[]
  linkedin?: string
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
        setError(null)
        const result = await getEditorialBoard()
        if (result.success && result.data) {
          setMembers(result.data)
          console.log("Fetched members:", result.data.length)
        } else {
          setError(result.error || "Failed to load editorial board members")
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

  // Sort members by their order property and group by type
  const sortedMembers = [...members].sort((a, b) => a.order - b.order)
  const editors = sortedMembers.filter(member => member.memberType === BoardMemberType.Editor)

  // Convert board member to author format for AuthorProfile
  const getAuthorData = (member: EditorialBoardMember): Author => ({
    id: member.id,
    email: member.email || "",
    name: member.name,
    slug: member.id,
    title: member.designation,
    bio: member.bio,
    image: member.image,
    expertise: member.expertise || [],
    socialLinks: {
      linkedin: member.linkedin,
      email: member.email,
    },
  })

  // Empty state component
  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No {type} Found</h3>
      <p className="text-muted-foreground">
        There are currently no {type.toLowerCase()} in the editorial board.
      </p>
    </div>
  )

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
      <main className="flex-1 px-4">
        <div className="max-w-5xl mx-auto text-center ">
          <div className="mb-8 animate-slide-up justify-center pt-10 space-y-3">
            <h1 className="text-4xl sm:text-5xl text-center">Editorial Board</h1>
            <p className="text-stone-600 text-xs md:text-sm font-normal justify-center align-middle content-center text-center max-w-4xl mx-auto">
              Meet the distinguished scholars and legal experts who guide our publications and maintain the highest standards of academic excellence.
            </p>
          </div>

          {editors.length > 0 ? (
            // <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 ">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 ">
              {editors.map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  index={index}
                  onClick={setSelectedMember}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="Editorial Board Members" />
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
                  <span className="text-sm text-muted-foreground">
                    {selectedMember.designation}
                  </span>
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