import Image from "next/image"
import Link from "next/link"
import { Mail, Twitter, Linkedin, Instagram, Award, BookOpen, ExternalLink, MapPin, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Author } from "@/lib/types"

interface AuthorProfileProps {
  author: Author
  articleCount: number
  detailed?: boolean
}

export function AuthorProfile({ author, articleCount, detailed = false }: AuthorProfileProps) {
  return (
    <Card className="overflow-hidden">
      {author.image && (
        <div className="relative aspect-square w-full max-h-64 overflow-hidden md:aspect-auto md:h-48">
          <Image src={author.image || "/placeholder.svg"} alt={author.name} fill className="object-cover" />
        </div>
      )}
      <CardContent className="p-6">
        <div className="mb-4 space-y-2">
          <h1 className="text-2xl font-bold font-serif">{author.name}</h1>
          {author.title && <p className="text-muted-foreground">{author.title}</p>}

          {/* Location and Affiliation - only show if available */}
          {(author.location || author.affiliation) && (
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {author.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{author.location}</span>
                </div>
              )}
              {author.affiliation && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{author.affiliation}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bio section - only show if available */}
        {author.bio && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Biography</h3>
            {detailed && author.detailedBio ? (
              <div className="text-sm space-y-4">
                {author.detailedBio.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{author.bio}</p>
            )}
          </div>
        )}

        {/* Notable Achievements - only show if available */}
        {author.achievements && author.achievements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Notable Achievements</h3>
            <ul className="text-sm space-y-2">
              {author.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas of Expertise - only show if available */}
        {author.expertise && author.expertise.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Areas of Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {author.expertise.map((area) => (
                <Badge key={area} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Education - only show if available */}
        {author.education && author.education.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Education</h3>
            <ul className="text-sm space-y-1">
              {author.education.map((edu) => (
                <li key={edu}>{edu}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Publications - only show if available */}
        {author.publications && author.publications.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Selected Publications</h3>
            <ul className="text-sm space-y-2">
              {author.publications.map((pub, index) => (
                <li key={index} className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{pub}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator className="my-6" />

        {/* Footer with article count and social links */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                <BookOpen className="inline-block mr-1 h-4 w-4" />
                {articleCount} {articleCount === 1 ? "Article" : "Articles"} Published
              </p>
            </div>
          </div>

          {/* Social Links - only show if available */}
          {author.socialLinks && Object.values(author.socialLinks).some((link) => link) && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Connect</h3>
              <div className="flex flex-wrap gap-2">
                {author.socialLinks.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={author.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <Twitter className="h-4 w-4" />
                      <span>Twitter</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                {author.socialLinks.linkedin && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={author.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                {author.socialLinks.instagram && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={author.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>Instagram</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                {author.socialLinks.email && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`mailto:${author.socialLinks.email}`} className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </Link>
                  </Button>
                )}
                {author.website && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={author.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Website</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
