"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { 
  Bell, 
  Calendar, 
  ExternalLink, 
  Megaphone, 
  BookOpen, 
  Award, 
  Briefcase, 
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { NotificationType, Priority } from "@prisma/client"
import { NotificationContentRenderer, hasHyperlinks } from "@/components/notification-content-renderer"

// Define the notification interface based on the updated database schema
interface NotificationData {
  id: string
  title: string
  content: string
  type: NotificationType
  priority: Priority
  linkDisplay?: string | null
  linkUrl?: string | null
  expiresAt?: Date | string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  date?: string // For display purposes (backward compatibility)
}

interface NotificationCardProps {
  notification: NotificationData
  index: number
  unread?: boolean
  onMarkAsRead?: (id: string) => void
  className?: string
}

export function NotificationCard({
  notification,
  // index,
  // unread = false,
  // onMarkAsRead,
  className,
}: NotificationCardProps) {
  // const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Priority-based styling
  // const priorityClasses = {
  //   high: "border-destructive/30 bg-destructive/5 shadow-sm",
  //   medium: "border-primary/20 bg-primary/5",
  //   low: "border-muted-foreground/20 bg-muted/5",
  // }

  const priorityIndicators = {
    high: <AlertTriangle className="h-3 w-3 text-destructive" />,
    medium: <Clock className="h-3 w-3 text-primary" />,
    low: <CheckCircle2 className="h-3 w-3 text-muted-foreground" />,
  }

  // Map notification type to icon
  // const getNotificationIcon = (type: NotificationType) => {
  //   const iconMap = {
  //     [NotificationType.call_for_papers]: <BookOpen className="h-4 w-4" />,
  //     [NotificationType.student_competition]: <Award className="h-4 w-4" />,
  //     [NotificationType.editorial_vacancy]: <Briefcase className="h-4 w-4" />,
  //     [NotificationType.special_issue]: <Users className="h-4 w-4" />,
  //     [NotificationType.event]: <Calendar className="h-4 w-4" />,
  //     [NotificationType.publication]: <ExternalLink className="h-4 w-4" />,
  //     [NotificationType.announcement]: <Megaphone className="h-4 w-4" />,
  //     [NotificationType.general]: <Bell className="h-4 w-4" />,
  //   }
  //   return iconMap[type] || <Bell className="h-4 w-4" />
  // }

  // Get notification type display name
  // const getNotificationTypeName = (type: NotificationType) => {
  //   const nameMap = {
  //     [NotificationType.call_for_papers]: "Call for Papers",
  //     [NotificationType.student_competition]: "Student Competition",
  //     [NotificationType.editorial_vacancy]: "Editorial Vacancy",
  //     [NotificationType.special_issue]: "Special Issue",
  //     [NotificationType.event]: "Event",
  //     [NotificationType.publication]: "Publication",
  //     [NotificationType.announcement]: "Announcement",
  //     [NotificationType.general]: "General",
  //   }
  //   return nameMap[type] || type.replace(/_/g, " ")
  // }

  // Format date for display
  // const formatNotificationDate = () => {
  //   const dateToFormat = notification.date 
  //     ? new Date(notification.date) 
  //     : notification.createdAt 
  //     ? new Date(notification.createdAt)
  //     : new Date()

  //   return formatDistanceToNow(dateToFormat, { addSuffix: true })
  // }

  // Check if notification is expired
  // const isExpired = notification.expiresAt 
  //   ? new Date(notification.expiresAt) < new Date()
  //   : false

  // Handle mark as read
  // const handleMarkAsRead = async () => {
  //   if (!onMarkAsRead || isMarkingRead) return
    
  //   setIsMarkingRead(true)
  //   try {
  //     await onMarkAsRead(notification.id)
  //   } catch (error) {
  //     console.error('Failed to mark notification as read:', error)
  //   } finally {
  //     setIsMarkingRead(false)
  //   }
  // }

  // Check if content has hyperlinks for better display
  // const contentHasLinks = hasHyperlinks(notification.content)
  
  // Determine if content should be truncated
  const shouldTruncate = notification.content.length > 150
  const displayContent = shouldTruncate && !isExpanded 
    ? notification.content.slice(0, 150) + "..."
    : notification.content

  return (
    <Card 
      className={cn(
        "relative transition-all duration-200 hover:shadow-md bg-red-50/60 ",
        // priorityClasses[notification.priority],
        // unread && "ring-2 ring-primary/20",
        // isExpired && "opacity-75",
        className
      )}
    >
      {/* Priority indicator */}
      {/* <div className="absolute top-2 right-2 flex items-center gap-1">
        {priorityIndicators[notification.priority]}
        {unread && (
          <div className="w-2 h-2 bg-primary rounded-full"></div>
        )}
      </div> */}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div> */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-2 pr-8">
              {notification.title}
            </CardTitle>
            {/* <div className="flex items-center gap-2 mt-1"> */}
              {/* <span className="text-xs text-muted-foreground">
                {formatNotificationDate()}
              </span> */}
              {/* {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )} */}
            {/* </div> */}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Content with hyperlink support */}
        <div className="space-y-3 text-start">
          <NotificationContentRenderer 
            content={displayContent}
            className="text-sm text-stone-500 leading-relaxed"
          />
          
          {/* Expand/Collapse for long content */}
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 p-0 text-xs text-primary hover:text-primary/80"
            >
              {isExpanded ? "Show less" : "Read more"}
            </Button>
          )}

          {/* Expiration date display */}
          {/* {notification.expiresAt && !isExpired && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Expires {formatDistanceToNow(new Date(notification.expiresAt), { addSuffix: true })}
              </span>
            </div>
          )} */}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              {/* Main action button using new schema fields */}
              {notification.linkUrl && (
                <Button asChild variant="outline" size="sm">
                  <Link 
                    href={notification.linkUrl}
                    target={notification.linkUrl.startsWith('http') ? '_blank' : undefined}
                    rel={notification.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {notification.linkDisplay || "View Details"}
                    {notification.linkUrl.startsWith('http') && (
                      <ExternalLink className="ml-1 h-3 w-3" />
                    )}
                  </Link>
                </Button>
              )}
              
              {/* Show hyperlink indicator */}
              {/* {contentHasLinks && (
                <Badge variant="secondary" className="text-xs">
                  <ExternalLink className="h-2 w-2 mr-1" />
                  Links
                </Badge>
              )} */}
            </div>

            {/* Mark as read button */}
            {/* {unread && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                disabled={isMarkingRead}
                className="text-xs"
              >
                {isMarkingRead ? (
                  <Clock className="h-3 w-3 animate-spin" />
                ) : (
                  "Mark as read"
                )}
              </Button>
            )} */}
          </div>

          {/* Published date at the bottom */}
          {/* {notification.createdAt && ( */}
            <div className="flex items-center justify-end pt-2">
              <span className="text-xs text-stone-500">
                Published: {notification.date}
              </span>
            </div>
          {/* )} */}
        </div>
      </CardContent>
    </Card>
  )
}