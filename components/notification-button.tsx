"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Loader2, AlertTriangle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { getAllNotifications } from "@/lib/actions/notification-actions"
import { NotificationContentRenderer } from "@/components/notification-content-renderer"
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
  createdAt: string
  type: string
  priority: string
  linkDisplay?: string | null
  linkUrl?: string | null
  expiresAt?: string | null
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
        const result = await getAllNotifications()
        if (result.success && result.data) {
          setNotifications(result.data)
        } else {
          setError(result.error || "Failed to load notifications")
        }
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

  // Show most recent notifications (up to 5)
  const recentNotifications = notifications.slice(0, 5)

  const handleNotificationClick = (notification: Notification) => {
    if (notification.linkUrl) {
      if (notification.linkUrl.startsWith('http')) {
        window.open(notification.linkUrl, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = notification.linkUrl
      }
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-4 w-4 mr-2"  />
          <span className="text-xs font-bold">NOTIFICATIONS</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Recent Notifications</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading notifications...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-4 text-destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications available</p>
            </div>
          ) : (
            recentNotifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onClick={() => handleNotificationClick(notification)}
                onClose={() => setOpen(false)}
              />
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                href="/notifications" 
                className="w-full text-white bg-primary cursor-pointer justify-center font-medium"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({
  notification,
  onClick,
  onClose,
}: { 
  notification: Notification
  onClick: () => void
  onClose: () => void
}) {
  const typeDisplayName = notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  // Check if notification is expired
  const isExpired = notification.expiresAt 
    ? new Date(notification.expiresAt) < new Date()
    : false

  // Truncate content for dropdown display
  const truncatedContent = notification.content.length > 120 
    ? notification.content.slice(0, 120) + "..."
    : notification.content

  return (
    <div
      className={cn(
        "py-3 px-4 hover:bg-muted cursor-pointer border-b border-border/50 last:border-b-0 transition-colors",
        isExpired && "opacity-75"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h5 className="text-sm font-semibold line-clamp-1 pr-2">
          {notification.title.toLocaleUpperCase()}
        </h5>
      </div>
      
      <div className="space-y-2">
        {/* Render content with proper hyperlink support */}
        <div className="text-xs text-muted-foreground">
          <NotificationContentRenderer 
            content={truncatedContent}
            className="text-xs text-muted-foreground leading-relaxed"
            onLinkClick={onClose}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
          <Badge variant="outline" className="text-xs">
            {typeDisplayName}
          </Badge>
        </div>
        
        {/* Primary action link using new schema fields */}
        {notification.linkUrl && notification.linkDisplay && (
          <div className="flex items-center gap-1 text-xs text-primary hover:underline">
            <span>{notification.linkDisplay}</span>
            {notification.linkUrl.startsWith('http') && (
              <ExternalLink className="h-3 w-3" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}