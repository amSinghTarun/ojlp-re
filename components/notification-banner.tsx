"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notifications } from "@/lib/notifications"
import { cn } from "@/lib/utils"

export function NotificationBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Only show unread high priority notifications
  const highPriorityNotifications = notifications.filter((n) => n.priority === "high" && !n.read)

  const hasNotifications = highPriorityNotifications.length > 0

  useEffect(() => {
    if (!hasNotifications) return

    // Rotate through notifications every 8 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % highPriorityNotifications.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [hasNotifications, highPriorityNotifications.length])

  if (!hasNotifications || !isVisible) return null

  const notification = highPriorityNotifications[currentIndex]

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
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setIsVisible(false)}>
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {highPriorityNotifications.length > 1 && (
          <div className="flex gap-1 absolute bottom-0 left-1/2 transform -translate-x-1/2">
            {highPriorityNotifications.map((_, index) => (
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
