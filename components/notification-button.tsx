"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { notifications } from "@/lib/notifications"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NotificationButton() {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((notification) => !notification.read).length

  // Group notifications by type
  const callForPapers = notifications.filter((n) => n.type === "call-for-papers").slice(0, 3)
  const studentCompetitions = notifications.filter((n) => n.type === "student-competition").slice(0, 3)
  const editorialVacancies = notifications.filter((n) => n.type === "editorial-vacancy").slice(0, 3)
  const specialIssues = notifications.filter((n) => n.type === "special-issue").slice(0, 3)

  // Count unread notifications by category
  const unreadCfp = callForPapers.filter((n) => !n.read).length
  const unreadCompetitions = studentCompetitions.filter((n) => !n.read).length
  const unreadVacancies = editorialVacancies.filter((n) => !n.read).length
  const unreadSpecialIssues = specialIssues.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center text-xs rounded-full"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px]">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} />)
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full text-white bg-primary cursor-pointer justify-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({
  notification,
  onClick,
  icon,
}: { notification: Notification; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <Link href={notification.link || "/notifications"} onClick={onClick}>
      <div
        className={cn(
          "py-2 rounded-md px-3 hover:bg-muted cursor-pointer",
          !notification.read && "bg-muted/50",
        )}
      >
        <div className="flex justify-between items-start mb-1">
          <h5 className={cn("text-sm font-medium line-clamp-1", !notification.read && "font-bold")}>
            {notification.title}
          </h5>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{notification.content}</p>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
