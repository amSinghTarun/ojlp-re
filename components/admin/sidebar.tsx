"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  BookOpen,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Users,
  Scale,
  UserCog,
  FileQuestion,
  BookText,
  Briefcase,
  ShieldCheck,
  Lock,
} from "lucide-react"
// import { PERMISSIONS, hasPermission } from "@/lib/permissions"
import type { User } from "@/lib/types"

interface SidebarNavItem {
  title: string
  href: string
  icon: React.ElementType
  permissions: string
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    permissions: ""
  },
  {
    title: "Blog Posts",
    href: "/admin/posts",
    icon: FileText,
    permissions: "article"
  },
  {
    title: "Authors",
    href: "/admin/authors",
    icon: Users,
    permissions: "author"
  },
  {
    title: "Journal Issues",
    href: "/admin/journals",
    icon: BookOpen,
    permissions: "article"
  },
  {
    title: "Journal Articles",
    href: "/admin/journal-articles",
    icon: BookText,
    permissions: "article"
  },
  {
    title: "Call for Papers",
    href: "/admin/call-for-papers",
    icon: FileQuestion,
    permissions: "callforpaper"
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    permissions: "notification"
  },
  {
    title: "Media",
    href: "/admin/media",
    icon: ImageIcon,
    permissions: "media"
  },
  {
    title: "Editorial Board",
    href: "/admin/editorial-board",
    icon: UserCog,
    permissions: "editorialboardmember"
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    permissions: "user"
  },
  {
    title: "Role Management",
    href: "/admin/roles",
    icon: ShieldCheck,  
    permissions: "role"
  }
]

interface AdminSidebarProps {
  user: User
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()

  // Filter sidebar items based on user permissions
  const authorizedNavItems = sidebarNavItems.filter((item) => true)

  return (
    <div className="hidden border-r bg-background md:block md:w-64">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="rounded-full bg-primary p-1 text-primary-foreground">
            <Scale className="h-5 w-5" />
          </div>
          <span className="font-bold">OJLP Admin</span>
        </Link>
      </div>
      <ScrollArea className="h-[calc(100vh-64px)] py-4">
        <div className="px-3 py-2">
          <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground">Content Management</h3>
          <div className="space-y-1">
            {authorizedNavItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start",
                  pathname === item.href ? "bg-secondary" : "hover:bg-transparent hover:underline",
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
