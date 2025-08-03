"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, CalendarIcon, Link2, Eye, Info } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { createNotification, updateNotification } from "@/lib/actions/notification-actions"
import { NotificationType, Priority, type Notification } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  type: z.nativeEnum(NotificationType, {
    required_error: "Please select a notification type.",
  }),
  priority: z.nativeEnum(Priority).default(Priority.medium),
  linkDisplay: z.string().optional().or(z.literal("")),
  linkUrl: z.string().optional().or(z.literal("")),
  expiresAt: z.date().optional(),
})

interface NotificationFormProps {
  notification?: Notification
}

// Utility function to parse hyperlinks from content
export function parseHyperlinks(content: string): React.ReactNode[] {
  const hyperlinkRegex = /hyperLink:\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match

  while ((match = hyperlinkRegex.exec(content)) !== null) {
    // Add text before the hyperlink
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    // Add the hyperlink
    const linkText = match[1]
    const linkUrl = match[2]
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 underline font-medium"
      >
        {linkText}
      </a>
    )

    lastIndex = hyperlinkRegex.lastIndex
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts
}

// Preview component for rendered content
function ContentPreview({ content }: { content: string }) {
  const renderedContent = parseHyperlinks(content)
  
  return (
    <div className="prose prose-sm max-w-none">
      <div className="whitespace-pre-wrap text-sm text-muted-foreground">
        {renderedContent.length > 1 ? renderedContent : content}
      </div>
    </div>
  )
}

export function NotificationForm({ notification }: NotificationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: notification?.title || "",
      content: notification?.content || "",
      type: notification?.type || NotificationType.general,
      priority: notification?.priority || Priority.medium,
      linkDisplay: notification?.linkDisplay || "",
      linkUrl: notification?.linkUrl || "",
      expiresAt: notification?.expiresAt ? new Date(notification.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
    },
  })

  const contentValue = form.watch("content")

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)

    try {
      let result

      const submitData = {
        ...values,
        linkDisplay: values.linkDisplay || undefined,
        linkUrl: values.linkUrl || undefined,
      }

      if (notification) {
        // Update existing notification
        result = await updateNotification(notification.id, submitData)
      } else {
        // Create new notification
        result = await createNotification(submitData)
      }

      if (result.success) {
        toast({
          title: notification ? "Notification updated" : "Notification created",
          description: `"${values.title}" has been ${notification ? "updated" : "created"} successfully.`,
        })
        router.replace("/admin/notifications")
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save notification:", error)
      toast({
        title: "Error",
        description: "Failed to save notification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [notification, router, isSubmitting])

  const handleCancel = useCallback(() => {
    router.replace("/admin/notifications")
  }, [router])

  const insertHyperlink = useCallback(() => {
    const currentContent = form.getValues("content")
    const hyperlinkTemplate = "hyperLink:[Link Text](https://example.com)"
    const newContent = currentContent + (currentContent ? "\n" : "") + hyperlinkTemplate
    form.setValue("content", newContent)
  }, [form])

  // Format notification type options
  const notificationTypeOptions = Object.values(NotificationType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }))

  // Format priority options
  const priorityOptions = Object.values(Priority).map(priority => ({
    value: priority,
    label: priority.charAt(0).toUpperCase() + priority.slice(1)
  }))

  return (
    <div className="space-y-6">
      {/* Hyperlink Instructions */}
      <Alert>
        <Link2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Hyperlink Support:</strong> You can add clickable links in your content using the format{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">hyperLink:[Link Text](URL)</code>
          <br />
          Example: <code className="bg-muted px-1 py-0.5 rounded text-xs">hyperLink:[Visit our website](https://example.com)</code>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter notification title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Textarea 
                          placeholder="Enter notification content. Use hyperLink:[text](URL) for links." 
                          className="resize-none h-32" 
                          {...field} 
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={insertHyperlink}
                            className="h-8"
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            Insert Link
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {showPreview ? "Hide" : "Show"} Preview
                          </Button>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Add hyperlinks using: hyperLink:[Link Text](URL)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Preview */}
              {showPreview && contentValue && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Content Preview
                    </CardTitle>
                    <CardDescription>
                      This is how your content will appear to users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentPreview content={contentValue} />
                  </CardContent>
                </Card>
              )}

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {notificationTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="linkDisplay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Button Text (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Learn More, View Details" {...field} />
                    </FormControl>
                    <FormDescription>
                      Text for the main action button. Different from inline hyperlinks.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Button URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL for the main action button.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick expiration date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Optional expiration date. Leave empty for permanent notifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hyperlink Usage Guide */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Hyperlink Usage Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <strong>Format:</strong> <code className="bg-muted px-1 py-0.5 rounded">hyperLink:[text](URL)</code>
                  </div>
                  <div>
                    <strong>Examples:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-muted-foreground">
                      <li><code>hyperLink:[Submit Here](https://forms.example.com)</code></li>
                      <li><code>hyperLink:[Read More](https://blog.example.com/article)</code></li>
                      <li><code>hyperLink:[Guidelines](https://example.com/guidelines.pdf)</code></li>
                    </ul>
                  </div>
                  <div className="text-muted-foreground">
                    You can include multiple hyperlinks in your content. Each will be rendered as a clickable link.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {notification ? "Update" : "Create"} Notification
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}