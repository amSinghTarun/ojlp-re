"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { AuthorProfile } from "@/components/author-profile"
import type { Author } from "@/lib/types"

interface ProfileModalProps {
  person: any
  articleCount?: number
}

export function ProfileModal({ person, articleCount = 0 }: ProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Convert board member/advisor to author format if needed
  const authorData: Author = {
    id: person.id,
    name: person.name,
    slug: person.id.toString(),
    title: person.designation || person.title,
    bio: person.bio,
    image: person.image,
    expertise: person.expertise || [],
    education: person.education || [],
    socialLinks: {
      twitter: person.twitter || person.socialLinks?.twitter,
      linkedin: person.linkedin || person.socialLinks?.linkedin,
      email: person.email || person.socialLinks?.email,
    },
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer transition-all duration-300 hover:shadow-md h-full"
        role="button"
        tabIndex={0}
        aria-label={`View ${person.name}'s profile`}
      >
        {/* This will wrap around the existing card content */}
        {/* The children would go here in a real implementation */}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${person.name}'s Profile`}>
        <AuthorProfile author={authorData} articleCount={articleCount} />
      </Modal>
    </>
  )
}
