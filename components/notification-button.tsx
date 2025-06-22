"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { getAllNotifications, markNotificationAsRead } from "@/lib/actions/notification-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  title: string
  content: string
  date: string
  type: string
  priority: string
  read: boolean
  link?: string | null
  expiresAt?: string | null
  image?: string | null
}

export function NotificationButton() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications from database
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedNotifications = await getAllNotifications()
        setNotifications(fetchedNotifications.data)
      } catch (err) {
        console.error("Failed to fetch notifications:", err)
        setError("Failed to load notifications")
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Refresh notifications every 5 minutes
    const refreshInterval = setInterval(fetchNotifications, 5 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [])

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

  const handleNotificationClick = async (notificationId: string) => {
    // Mark notification as read
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      try {
        await markNotificationAsRead(notificationId)
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
      } catch (err) {
        console.error("Failed to mark notification as read:", err)
      }
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          {/* <Bell className="h-4 w-4 mr-2" /> */}
          Notifications
          {/* {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs rounded-full"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )} */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {/* {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )} */}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              {/* <Loader2 className="h-4 w-4 animate-spin mr-2" /> */}
              Notifications
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-4 text-destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onClick={() => handleNotificationClick(notification.id)}
              />
            ))
          )}
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link 
            href="/notifications" 
            className="w-full text-white bg-primary cursor-pointer justify-center"
            onClick={() => setOpen(false)}
          >
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
}: { 
  notification: Notification
  onClick: () => void
  icon?: React.ReactNode 
}) {
  return (
    <div
      className={cn(
        "py-2 rounded-md px-3 hover:bg-muted cursor-pointer border-b border-border/50 last:border-b-0",
        !notification.read && "bg-muted/50",
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-1">
        <h5 className={cn(
          "text-sm font-medium line-clamp-1", 
          !notification.read && "font-bold"
        )}>
          {notification.title}
        </h5>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {!notification.read && (
            <div className="w-2 h-2 bg-primary rounded-full" />
          )}
          <Badge 
            variant={notification.priority === "high" ? "destructive" : "secondary"} 
            className="text-xs"
          >
            {notification.priority}
          </Badge>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
            {notification.content}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
            </span>
            <Badge variant="outline" className="text-xs">
              {notification.type.replace(/-/g, ' ')}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}