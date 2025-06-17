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
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { NotificationType, Priority } from "@prisma/client"

// Define the notification interface based on the database schema
interface NotificationData {
  id: string
  title: string
  content: string
  type: NotificationType
  priority: Priority
  read: boolean
  link?: string | null
  image?: string | null
  date?: string // For display purposes
  expiresAt?: Date | string | null
  createdAt?: Date | string
  updatedAt?: Date | string
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
  index,
  unread = false,
  onMarkAsRead,
  className,
}: NotificationCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false)

  // Priority-based styling
  const priorityClasses = {
    high: "border-destructive/30 bg-destructive/5 shadow-sm",
    medium: "border-primary/20 bg-primary/5",
    low: "border-muted-foreground/20 bg-muted/5",
  }

  const priorityIndicators = {
    high: <AlertTriangle className="h-3 w-3 text-destructive" />,
    medium: <Clock className="h-3 w-3 text-primary" />,
    low: <CheckCircle2 className="h-3 w-3 text-muted-foreground" />,
  }

  // Map notification type to icon
  const getNotificationIcon = (type: NotificationType) => {
    const iconMap = {
      [NotificationType.call_for_papers]: <BookOpen className="h-4 w-4" />,
      [NotificationType.student_competition]: <Award className="h-4 w-4" />,
      [NotificationType.editorial_vacancy]: <Briefcase className="h-4 w-4" />,
      [NotificationType.special_issue]: <Users className="h-4 w-4" />,
      [NotificationType.event]: <Calendar className="h-4 w-4" />,
      [NotificationType.publication]: <ExternalLink className="h-4 w-4" />,
      [NotificationType.announcement]: <Megaphone className="h-4 w-4" />,
    }
    return iconMap[type] || <Bell className="h-4 w-4" />
  }

  // Get notification type display name
  const getNotificationTypeName = (type: NotificationType) => {
    const nameMap = {
      [NotificationType.call_for_papers]: "Call for Papers",
      [NotificationType.student_competition]: "Student Competition",
      [NotificationType.editorial_vacancy]: "Editorial Vacancy",
      [NotificationType.special_issue]: "Special Issue",
      [NotificationType.event]: "Event",
      [NotificationType.publication]: "Publication",
      [NotificationType.announcement]: "Announcement",
    }
    return nameMap[type] || type.replace("_", " ")
  }

  // Format date for display
  const formatNotificationDate = () => {
    const dateToFormat = notification.date 
      ? new Date(notification.date) 
      : notification.createdAt 
      ? new Date(notification.createdAt)
      : new Date()

    return formatDistanceToNow(dateToFormat, { addSuffix: true })
  }

  // Check if notification is expired
  const isExpired = notification.expiresAt 
    ? new Date(notification.expiresAt) < new Date() 
    : false

  // Handle image error
  const handleImageError = () => {
    setImageError(true)
  }

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (!onMarkAsRead || notification.read) return
    
    setIsMarkingRead(true)
    try {
      await onMarkAsRead(notification.id)
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    } finally {
      setIsMarkingRead(false)
    }
  }

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case Priority.high:
        return "destructive"
      case Priority.medium:
        return "default"
      case Priority.low:
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        priorityClasses[notification.priority],
        unread && "ring-2 ring-primary/30",
        isExpired && "opacity-75",
        className
      )}
      style={{ 
        animationDelay: `${index * 100}ms`,
        animationFillMode: "both"
      }}
    >
      {/* Image Section */}
      {notification.image && !imageError && (
        <div className="relative h-48 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
          <Image
            src={notification.image}
            alt={notification.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
          />
          {/* Overlay badges */}
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            {unread && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                New
              </Badge>
            )}
            {isExpired && (
              <Badge variant="outline" className="bg-background/80 text-muted-foreground">
                Expired
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 flex-1">
            {notification.title}
          </CardTitle>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Type Badge */}
            <Badge variant="outline" className="whitespace-nowrap">
              {getNotificationIcon(notification.type)}
              <span className="ml-1 text-xs">{getNotificationTypeName(notification.type)}</span>
            </Badge>
          </div>
        </div>

        {/* Priority and Status Indicators */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1">
            {priorityIndicators[notification.priority]}
            <Badge 
              variant={getPriorityBadgeVariant(notification.priority)} 
              className="text-xs px-2 py-1"
            >
              {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
            </Badge>
          </div>
          
          {!notification.read && (
            <Badge variant="secondary" className="text-xs px-2 py-1">
              Unread
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Content */}
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
          {notification.content}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatNotificationDate()}</span>
          </div>
          
          {notification.expiresAt && !isExpired && (
            <div className="flex items-center gap-1">
              <span>Expires:</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(notification.expiresAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {notification.link && (
            <Button asChild variant="default" size="sm" className="flex-1">
              <Link 
                href={notification.link}
                className="flex items-center gap-2"
                onClick={handleMarkAsRead}
              >
                <ExternalLink className="h-3 w-3" />
                View Details
              </Link>
            </Button>
          )}
          
          {!notification.read && onMarkAsRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsRead}
              disabled={isMarkingRead}
              className="shrink-0"
            >
              {isMarkingRead ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="ml-1">Marking...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="ml-1">Mark Read</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Expired Notice */}
        {isExpired && (
          <div className="bg-muted/50 border border-muted-foreground/20 rounded-md p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>This notification has expired</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}