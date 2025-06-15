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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search } from "lucide-react"
import { NotificationButton } from "@/components/notification-button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SearchDialog } from "@/components/search/search-dialog"

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

const submitLinks = [
  {
    title: "Submit Paper",
    href: "/submit",
    description: "Submit your research paper for publication.",
  },
  {
    title: "Call for Papers",
    href: "/journals/call-for-papers",
    description: "View current calls for papers and submission deadlines.",
  },
]

// Custom navigation link style with transparent background and subtle hover effect
const customNavLinkStyle = cn(
  navigationMenuTriggerStyle(),
  "bg-transparent hover:bg-secondary/50 text-foreground font-medium tracking-tight font-serif",
)

// Custom navigation trigger style with transparent background and subtle hover effect
const customNavTriggerStyle = cn(
  "bg-transparent data-[state=open]:bg-secondary/50 data-[active]:bg-transparent hover:bg-secondary/50 text-foreground font-medium tracking-tight font-serif",
)

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 relative">
            <Image
              src="/logo.png"
              alt="Open Journal of Law & Policy Logo"
              fill
              className="object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </div>
          <div className="font-heading font-semibold text-lg tracking-tight">Open Journal of Law & Policy</div>
        </Link>

        <div className="flex items-center space-x-4 lg:space-x-6">
          <div className="hidden md:flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink className={customNavLinkStyle}>Home</NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={customNavTriggerStyle}>About</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {aboutLinks.map((link) => (
                        <ListItem key={link.title} title={link.title} href={link.href}>
                          {link.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={customNavTriggerStyle}>Journal</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {journalLinks.map((link) => (
                        <ListItem key={link.title} title={link.title} href={link.href}>
                          {link.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/blogs" legacyBehavior passHref>
                    <NavigationMenuLink className={customNavLinkStyle}>Blogs</NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <div className="flex items-center mx-6 space-x-3">
              <SearchDialog />
              <NotificationButton />
            </div>

            {/* Submit Paper Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="transition-all duration-200 bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-full px-5 font-serif">
                  Submit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {submitLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="w-full flex items-center font-serif">
                      {link.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[350px] pr-0">
                <div className="flex items-center mb-8">
                  <Link href="/" className="flex items-center space-x-2 group">
                    <div className="w-8 h-8 relative">
                      <Image
                        src="/logo.png"
                        alt="Open Journal of Law & Policy Logo"
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="font-heading font-semibold text-lg">Open Journal of Law & Policy</div>
                  </Link>
                </div>
                <nav className="grid gap-6 text-lg font-medium pr-6 font-serif">
                  <Link
                    href="/"
                    className={cn(
                      "hover:text-primary transition-colors",
                      pathname === "/" ? "text-primary font-semibold" : "text-foreground",
                    )}
                  >
                    Home
                  </Link>
                  <div className="grid gap-3 pl-3">
                    <h3 className="text-foreground font-semibold font-heading">About</h3>
                    {aboutLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "text-muted-foreground hover:text-primary transition-colors",
                          pathname === link.href ? "text-primary" : "",
                        )}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                  <div className="grid gap-3 pl-3">
                    <h3 className="text-foreground font-semibold font-heading">Journal</h3>
                    {journalLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "text-muted-foreground hover:text-primary transition-colors",
                          pathname === link.href ? "text-primary" : "",
                        )}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/blogs"
                    className={cn(
                      "hover:text-primary transition-colors",
                      pathname === "/blogs" ? "text-primary font-semibold" : "text-foreground",
                    )}
                  >
                    Blogs
                  </Link>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => document.querySelector('[aria-label="Search"]')?.click()}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      <span>Search</span>
                    </Button>
                    <NotificationButton />
                  </div>

                  {/* Mobile Submit Options */}
                  <div className="grid gap-3 pl-3 mt-2">
                    <h3 className="text-foreground font-semibold font-heading">Submit</h3>
                    {submitLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "text-muted-foreground hover:text-primary transition-colors",
                          pathname === link.href ? "text-primary" : "",
                        )}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

const ListItem = React.forwardRef<React.ElementRef<"a">, React.ComponentPropsWithoutRef<"a">>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none font-heading">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground font-serif">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = "ListItem"
