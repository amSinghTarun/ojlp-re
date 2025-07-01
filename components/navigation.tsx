"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search, X } from "lucide-react"
import { NotificationButton } from "@/components/notification-button"

const aboutLinks = [
  {
    title: "About Us",
    href: "/about",
    description: "Learn about our mission, values, and history.",
  },
  {
    title: "Editorial Board",
    href: "/editorial-board",
    description: "Meet our distinguished editorial board members.",
  },
  {
    title: "Board of Advisors",
    href: "/board-of-advisors",
    description: "Meet our expert advisors who guide our strategic direction.",
  },
  {
    title: "Contact",
    href: "/contact",
    description: "Get in touch with our team.",
  },
]

const journalLinks = [
  {
    title: "Current Issue",
    href: "/journals",
    description: "Read our latest journal issue.",
  },
  {
    title: "Archive",
    href: "/journals/archive",
    description: "Browse our past journal issues.",
  },
]

// Custom Celtic knot icon component
const CelticKnot = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <path
      d="M24 4C24 4 14 10 14 24C14 38 24 44 24 44C24 44 34 38 34 24C34 10 24 4 24 4Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M4 24C4 24 10 14 24 14C38 14 44 24 44 24C44 24 38 34 24 34C10 34 4 24 4 24Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="24" cy="24" r="4" fill="currentColor" />
  </svg>
)

// Custom navigation styles for the red theme
const customNavLinkStyle = cn(
  "text-white/90 hover:text-white hover:bg-white/10 font-medium text-sm tracking-wide transition-all duration-200 px-4 py-2 rounded-none border-b-2 border-transparent hover:border-white/30"
)

export function Navigation() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-red-800 shadow-lg">
      {/* Main Header Section */}
      <div className="bg-red-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Logo and Title */}
            <Link href="/" className="flex flex-col items-center space-y-3 group">
              <div className="w-16 h-16 relative">
                <Image
                  src="/logo.png"
                  alt="Open Journal of Law & Policy"
                  fill
                  className="object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="text-center">
                <h1 className="text-white text-lg md:text-3xl  tracking-wider">
                  Open Journal of Law & Policy
                </h1>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-red-900 backdrop-blur-sm border-t border-red-700">
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <nav className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-1">
                <Link
                  href="/about"
                  className={cn(customNavLinkStyle, pathname === "/about" && "border-white text-white")}
                >
                  About Us
                </Link>
                
                <Link
                  href="/submit"
                  className={cn(customNavLinkStyle, pathname === "/submit" && "border-white text-white")}
                >
                  Submissions
                </Link>
                
                <Link
                  href="/contact"
                  className={cn(customNavLinkStyle, pathname === "/contact" && "border-white text-white")}
                >
                  Contacts
                </Link>
                
                <Link
                  href="/journals/archive"
                  className={cn(customNavLinkStyle, pathname === "/journals/archive" && "border-white text-white")}
                >
                  Archives
                </Link>
                
                <Link
                  href="/editorial-board"
                  className={cn(customNavLinkStyle, pathname === "/editorial-board" && "border-white text-white")}
                >
                  Editorial Board
                </Link>
                
                <Link
                  href="/board-of-advisors"
                  className={cn(customNavLinkStyle, pathname === "/board-of-advisors" && "border-white text-white")}
                >
                  Advisory Board
                </Link>

                {/* Notification Button */}
                <div className="ml-4 pl-4 border-l border-white/20">
                  <div className="text-white">
                    <NotificationButton />
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden py-3">
            <div className="flex items-center justify-between">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Menu className="h-5 w-5" />
                    <span className="ml-2">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] bg-red-800 border-red-700">
                  <div className="flex flex-col space-y-4 mt-6">
                    <Link
                      href="/about"
                      className="text-white hover:text-red-200 text-lg font-medium py-2 border-b border-red-700/50"
                    >
                      About Us
                    </Link>
                    <Link
                      href="/submissions"
                      className="text-white hover:text-red-200 text-lg font-medium py-2 border-b border-red-700/50"
                    >
                      Submissions
                    </Link>
                    <Link
                      href="/contact"
                      className="text-white hover:text-red-200 text-lg font-medium py-2 border-b border-red-700/50"
                    >
                      Contacts
                    </Link>
                    <Link
                      href="/journals/archive"
                      className="text-white hover:text-red-200 text-lg font-medium py-2 border-b border-red-700/50"
                    >
                      Archives
                    </Link>
                    <Link
                      href="/editorial-board"
                      className="text-white hover:text-red-200 text-lg font-medium py-2 border-b border-red-700/50"
                    >
                      Editorial Board
                    </Link>
                    <Link
                      href="/board-of-advisors"
                      className="text-white hover:text-red-200 text-lg font-medium py-2"
                    >
                      Advisory Board
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="text-white">
                <NotificationButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

const ListItem = React.forwardRef<React.ElementRef<"a">, React.ComponentPropsWithoutRef<"a">>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <div>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </a>
      </div>
    )
  },
)
ListItem.displayName = "ListItem"