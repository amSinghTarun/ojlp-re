"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notifications } from "@/lib/notifications"
import { cn } from "@/lib/utils"

export function NotificationTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filter notifications - show all unread high priority notifications
  const unreadHighPriorityNotifications = notifications.filter((n) => !n.read && n.priority === "high")

  const hasNotifications = unreadHighPriorityNotifications.length > 0

  useEffect(() => {
    if (!hasNotifications) return

    // Rotate through notifications every 8 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % unreadHighPriorityNotifications.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [hasNotifications, unreadHighPriorityNotifications.length])

  if (!hasNotifications) return null

  const notification = unreadHighPriorityNotifications[currentIndex]

  return (
    <div className="bg-primary py-4 border-y border-primary/20 relative overflow-hidden">
      <div className="container px-4 relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center text-sm flex-1 overflow-hidden">
            <div className="bg-white/20 p-2 text-white font-bold rounded-full mr-4 flex-shrink-0">IN FOCUS</div>
            <div className="flex flex-col overflow-hidden">
              <div className="flex flex-row items-center flex-wrap">
                <Link href={notification.link || "/notifications"} className="hover:underline">
                  <span className="font-bold text-white mr-1">{notification.title}</span>
                </Link>
                <span className="font-bold text-white">•</span>
                <span className="ml-1 text-white/70"> {notification.date}</span>
              </div>
              <div key={`notification-${currentIndex}`} className="overflow-hidden whitespace-nowrap hidden sm:block">
                <span className="text-white/80 inline-block animate-marquee">{notification.content}</span>
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
        {unreadHighPriorityNotifications.length > 1 && (
          <div className="flex gap-1 absolute bottom-0 left-1/2 transform -translate-x-1/2 -mb-1">
            {unreadHighPriorityNotifications.map((_, index) => (
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
