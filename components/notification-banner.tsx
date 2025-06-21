"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, ChevronRight, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getHighPriorityNotifications } from "@/lib/actions/notification-actions"

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

export function NotificationBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications from database
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setIsLoading(true)
        setError(null)
        const fetchedNotifications = await getHighPriorityNotifications()
        setNotifications(fetchedNotifications)
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

  const hasNotifications = notifications.length > 0

  useEffect(() => {
    if (!hasNotifications) return

    // Rotate through notifications every 8 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [hasNotifications, notifications.length])

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-primary/10 text-primary border-b border-primary/20">
        <div className="container px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            {/* <Loader2 className="h-4 w-4 animate-spin" /> */}
            <span>Notifications</span>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-orange-100 text-orange-800 border-b border-orange-200">
        <div className="container px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center text-sm">
              <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>⚠️ {error}</span>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 text-orange-800 hover:bg-orange-200" 
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if no notifications or dismissed
  if (!hasNotifications || !isVisible) return null

  const notification = notifications[currentIndex]

  return (
    <div className="bg-primary/10 text-primary border-b border-primary/20 relative overflow-hidden">
      <div className="container px-4 py-2 relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center text-sm">
            <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
            <p className="line-clamp-1">
              <span className="font-medium mr-1">{notification.title}:</span>
              <span className="hidden sm:inline">{notification.content}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="px-2 h-7 text-xs border-primary/20 hover:bg-primary/20"
            >
              <Link href={notification.link || "/notifications"}>
                View
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0" 
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {notifications.length > 1 && (
          <div className="flex gap-1 absolute bottom-0 left-1/2 transform -translate-x-1/2">
            {notifications.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 w-8 rounded-full bg-primary/20 transition-all duration-300",
                  index === currentIndex && "bg-primary",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}