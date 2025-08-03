// components/member-card.tsx
"use client"

import Image from "next/image"
import { Mail, Linkedin } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Button } from "@/components/ui/button"

interface MemberCardProps {
  member: {
    id: string
    name: string
    designation: string
    image?: string
    bio?: string
    email?: string
    linkedin?: string
    orcid?: string
    affiliation?: string,
    expertise: string[]
  }
  index: number
  onClick: (member: any) => void
}

export function MemberCard({ member, index, onClick }: MemberCardProps) {
  return (
    <ScrollReveal key={member.id} delay={index * 100}>
      <div
        className="p-2 rounded-sm overflow-hidden border border-stone-100"
        onClick={() => onClick(member)}
      >
        {member.image ? (
          <div className="relative w-full">
          <Image
            src={member.image}
            alt={member.name}
            height={0}
            width={0}
            className="object-contain h-auto w-full"
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
        <div className="pt-2 px-2 text-center content-center space-y-2 ">
          <h1 className="text-xl text-stone-800 font-bold">{member.name.toUpperCase()}</h1>
          <div className="text-stone-900 text-sm ">{member.designation}</div>
          {member.bio && <div className="text-xs mb-4 text-stone-600 ">{member.bio}</div>}
          {member.expertise && member.expertise.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-stone-500 uppercase">
                Areas of Expertise
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {member.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className=" px-2 py-1 text-xs text-primary font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="pt-2 border-t border-stone-100 flex content-center text-center justify-center align-middle items-center gap-2 ">
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
  )
}