import Link from "next/link"
import { Linkedin, Twitter, Facebook, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface SocialLinksProps {
  className?: string
}

export function SocialLinks({ className }: SocialLinksProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Link
        href="https://linkedin.com"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-card hover:bg-accent p-2 rounded-full transition-colors duration-200"
        aria-label="LinkedIn"
      >
        <Linkedin className="h-5 w-5" />
      </Link>

      <Link
        href="https://twitter.com"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-card hover:bg-accent p-2 rounded-full transition-colors duration-200"
        aria-label="Twitter/X"
      >
        <Twitter className="h-5 w-5" />
      </Link>

      <Link
        href="https://facebook.com"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-card hover:bg-accent p-2 rounded-full transition-colors duration-200"
        aria-label="Facebook"
      >
        <Facebook className="h-5 w-5" />
      </Link>

      <Link
        href="mailto:journal@ojlp.in"
        className="bg-card hover:bg-accent p-2 rounded-full transition-colors duration-200"
        aria-label="Email"
      >
        <Mail className="h-5 w-5" />
      </Link>
    </div>
  )
}
