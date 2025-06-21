"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight, Loader2 } from "lucide-react"
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

export function NotificationTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)
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
      <div className="relative overflow-hidden px-5 py-10">
        <div className="py-4 bg-gray-600 container px-4 rounded-lg relative">
          <div className="flex items-center justify-center gap-2 text-white">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading notifications...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="relative overflow-hidden px-5 py-10">
        <div className="py-4 bg-orange-600 container px-4 rounded-lg relative">
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="text-sm">⚠️ {error}</span>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if no notifications
  if (!hasNotifications) return null

  const notification = notifications[currentIndex]

  return (
    <div className="relative overflow-hidden px-5 py-10">
      <div className="py-4 bg-red-900 container px-4 rounded-lg relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center text-sm flex-1 overflow-hidden">
            <div className="bg-white/20 p-2 text-white font-bold rounded-full mr-4 flex-shrink-0">
              IN FOCUS
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="flex flex-row items-center flex-wrap">
                <Link href={notification.link || "/notifications"} className="hover:underline">
                  <span className="font-bold text-white mr-1">{notification.title}</span>
                </Link>
                <span className="font-bold text-white">•</span>
                <span className="ml-1 text-white/70"> {notification.date}</span>
              </div>
              <div key={`notification-${currentIndex}`} className="overflow-hidden whitespace-nowrap hidden sm:block">
                <span className="text-white/80 inline-block animate-marquee">
                  {notification.content}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 hidden sm:block">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="px-3 h-8 text-xs border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href={notification.link || "/notifications"}>
                View Details
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {notifications.length > 1 && (
          <div className="flex gap-1 absolute bottom-0 left-1/2 transform -translate-x-1/2 -mb-1">
            {notifications.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 w-8 rounded-full bg-white/20 transition-all duration-300",
                  index === currentIndex && "bg-white/70",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}