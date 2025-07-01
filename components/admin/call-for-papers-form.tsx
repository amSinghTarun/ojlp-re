"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { createCallForPapers, updateCallForPapers } from "@/lib/actions/call-for-papers-actions"
import { CalendarIcon, Loader2, Plus, X, Bell, CheckCircle, AlertTriangle, XCircle, ExternalLink } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Schema with conditional validation for guidelines based on create vs edit
const createFormSchema = (isEditing: boolean = false) => z.object({
  title: z.string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  thematicFocus: z.string()
    .min(1, "Thematic focus is required")
    .min(3, "Thematic focus must be at least 3 characters")
    .max(100, "Thematic focus must be less than 100 characters"),
  description: z.string()
    .min(1, "Description is required")
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters"),
  contentLink: z.string()
    .optional()
    .refine((url) => {
      // If no URL provided, it's valid (optional field)
      if (!url || url.trim() === '') return true;
      
      // If URL is provided, validate it
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }, "Please enter a valid URL")
    .refine((url) => {
      // If no URL provided, it's valid (optional field)
      if (!url || url.trim() === '') return true;
      
      // If URL is provided, check against common academic/submission platform patterns
      const validPatterns = [
        /^https?:\/\/.*\.pdf$/i,
        /^https?:\/\/.*doi\.org\//i,
        /^https?:\/\/.*easychair\.org\//i,
        /^https?:\/\/.*edas\.info\//i,
        /^https?:\/\/.*conftools\.net\//i,
        /^https?:\/\/.*openconf\.org\//i,
        /^https?:\/\/.*scholarone\.com\//i,
        /^https?:\/\/.*manuscript\.com\//i,
        /^https?:\/\/.*editorialmanager\.com\//i,
        /^https?:\/\/.*journals\..*\//i,
        /^https?:\/\/.*conference\..*\//i,
        /^https?:\/\/.*submission\..*\//i,
        /^https?:\/\/.*call-for-papers\..*\//i,
        /^https?:\/\/.*forms\..*\//i,
        /^https?:\/\/.+/i, // Allow any HTTPS URL as fallback
      ];
      return validPatterns.some(pattern => pattern.test(url));
    }, "Please provide a valid link to submission instructions, submission system, or detailed call for papers"),
  deadline: z.date({ 
    required_error: "Deadline is required",
    invalid_type_error: "Please select a valid date"
  }).refine((date) => date > new Date(), {
    message: "Deadline must be in the future"
  }),
  volume: z.coerce.number()
    .min(1, "Volume must be at least 1")
    .max(999, "Volume must be less than 999")
    .int("Volume must be a whole number"),
  issue: z.coerce.number()
    .min(1, "Issue must be at least 1")
    .max(99, "Issue must be less than 99")
    .int("Issue must be a whole number"),
  year: z.coerce.number()
    .min(1900, "Year must be 1900 or later")
    .max(2100, "Year must be 2100 or earlier")
    .int("Year must be a whole number"),
  guidelines: z.string()
    .min(1, "Guidelines are required")
    .min(isEditing ? 1 : 50, isEditing ? "Guidelines cannot be empty" : "Guidelines must be at least 50 characters")
    .max(5000, "Guidelines must be less than 5000 characters"),
  image: z.string()
    .optional()
    .refine((val) => !val || val.startsWith('http'), {
      message: "Image must be a valid URL starting with http or https"
    }),
  fee: z.string()
    .optional()
    .refine((val) => !val || val.length <= 50, {
      message: "Fee description must be less than 50 characters"
    }),
  topics: z.array(z.string()).default([]),
  eligibility: z.string()
    .optional()
    .refine((val) => !val || val.length <= 1000, {
      message: "Eligibility criteria must be less than 1000 characters"
    }),
  contact: z.string()
    .optional()
    .refine((val) => !val || val.length <= 100, {
      message: "Contact information must be less than 100 characters"
    }),
})

type FormData = z.infer<ReturnType<typeof createFormSchema>>

interface CallForPapersFormProps {
  cfp?: {
    id: string
    title: string
    thematicFocus: string
    description: string
    contentLink?: string
    deadline: Date
    volume: number
    issue: number
    year: number
    guidelines: string
    image?: string | null
    fee?: string | null
    topics: string[]
    eligibility?: string | null
    contact?: string | null
  }
}

export function CallForPapersForm({ cfp }: CallForPapersFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newTopic, setNewTopic] = useState("")
  
  // Determine if we're editing
  const isEditing = !!cfp
  const formSchema = createFormSchema(isEditing)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: cfp?.title || "",
      thematicFocus: cfp?.thematicFocus || "",
      description: cfp?.description || "",
      contentLink: cfp?.contentLink || "",
      deadline: cfp?.deadline || new Date(),
      volume: cfp?.volume || new Date().getFullYear() - 2020 + 1,
      issue: cfp?.issue || 1,
      year: cfp?.year || new Date().getFullYear(),
      guidelines: cfp?.guidelines || "",
      image: cfp?.image || "",
      fee: cfp?.fee || "",
      topics: cfp?.topics || [],
      eligibility: cfp?.eligibility || "",
      contact: cfp?.contact || "",
    },
  })

  const topics = form.watch("topics")
  const contentLink = form.watch("contentLink")

  const addTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      if (topics.length >= 10) {
        toast({
          title: "Too many topics",
          description: "You can add a maximum of 10 topics.",
          variant: "destructive",
        })
        return
      }
      form.setValue("topics", [...topics, newTopic.trim()])
      setNewTopic("")
    } else if (topics.includes(newTopic.trim())) {
      toast({
        title: "Duplicate topic",
        description: "This topic has already been added.",
        variant: "destructive",
      })
    }
  }

  const removeTopic = (topicToRemove: string) => {
    form.setValue("topics", topics.filter(topic => topic !== topicToRemove))
  }

  // Enhanced error message formatter
  const formatErrorMessage = (error: any): { title: string; description: string } => {
    console.log("🔍 Formatting error:", error)

    // Handle validation errors
    if (typeof error === 'string') {
      if (error.includes('Unauthorized')) {
        return {
          title: "Permission Denied",
          description: "You don't have permission to manage calls for papers. Please contact an administrator."
        }
      }
      if (error.includes('duplicate')) {
        return {
          title: "Duplicate Entry",
          description: "A call for papers already exists for this volume, issue, and year combination. Please use different values."
        }
      }
      if (error.includes('required')) {
        return {
          title: "Missing Required Fields",
          description: error
        }
      }
      if (error.includes('database') || error.includes('connection')) {
        return {
          title: "Database Error",
          description: "Unable to connect to the database. Please try again or contact support if the problem persists."
        }
      }
      if (error.includes('network') || error.includes('fetch')) {
        return {
          title: "Network Error",
          description: "Network connection failed. Please check your internet connection and try again."
        }
      }
      return {
        title: "Error",
        description: error
      }
    }

    // Handle object errors
    if (error && typeof error === 'object') {
      if (error.message) {
        return formatErrorMessage(error.message)
      }
      if (error.error) {
        return formatErrorMessage(error.error)
      }
    }

    // Default error
    return {
      title: "Unexpected Error",
      description: "An unexpected error occurred. Please try again or contact support if the problem persists."
    }
  }

  const onSubmit = async (data: FormData) => {
    console.log("🚀 Form submission started")
    console.log("📋 Form data:", data)
    
    setIsLoading(true)

    try {
      // Client-side validation check
      const validation = formSchema.safeParse(data)
      if (!validation.success) {
        console.error("❌ Client-side validation failed:", validation.error)
        
        const fieldErrors = validation.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('\n')
        
        toast({
          title: "Validation Error",
          description: (
            <div className="space-y-2">
              <p>Please fix the following errors:</p>
              <div className="text-sm bg-muted p-2 rounded">
                {fieldErrors}
              </div>
            </div>
          ),
          variant: "destructive",
          duration: 8000,
        })
        return
      }

      console.log("✅ Client-side validation passed")
      console.log("📞 Calling server action...")
      
      const result = cfp
        ? await updateCallForPapers(cfp.id, data)
        : await createCallForPapers(data)

      console.log("📥 Server response:", result)

      if (result.success) {
        console.log("✅ Operation successful!")
        
        // Enhanced success message for new call for papers
        if (!cfp && result.notification) {
          toast({
            title: "🎉 Call for Papers Created Successfully!",
            description: (
              <div className="space-y-2">
                <p className="font-medium">"{data.title}" has been published.</p>
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <span>High-priority notification automatically created</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Now visible on public notifications page</span>
                </div>
                {data.contentLink && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-purple-500" />
                    <span>Submission link included in notification</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  Notification expires: {format(data.deadline, "PPP")}
                </div>
              </div>
            ),
            duration: 6000,
          })
        } else if (cfp) {
          toast({
            title: "✅ Call for Papers Updated",
            description: `"${data.title}" has been updated successfully.`,
            duration: 4000,
          })
        } else {
          toast({
            title: "✅ Call for Papers Created",
            description: `"${data.title}" has been created successfully.`,
            duration: 4000,
          })
        }
        
        console.log("🔄 Redirecting to admin page...")
        router.push("/admin/call-for-papers")
        router.refresh()
      } else {
        console.error("❌ Server returned error:", result.error)
        
        const errorInfo = formatErrorMessage(result.error)
        
        toast({
          title: errorInfo.title,
          description: (
            <div className="space-y-2">
              <p>{errorInfo.description}</p>
              {process.env.NODE_ENV === 'development' && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Technical Details</summary>
                  <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ),
          variant: "destructive",
          duration: 8000,
        })
      }
    } catch (error: any) {
      console.error("💥 Unexpected error:", error)
      
      const errorInfo = formatErrorMessage(error)
      
      toast({
        title: errorInfo.title,
        description: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>{errorInfo.description}</span>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Technical Details</summary>
                <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">
                  {error.stack || error.toString()}
                </pre>
              </details>
            )}
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      })
    } finally {
      setIsLoading(false)
      console.log("🏁 Form submission completed")
    }
  }

  return (
    <div className="space-y-6">
      {/* Information Alert for New Call for Papers */}
      {!cfp && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <strong>Auto-Notification:</strong> When you create this call for papers, a high-priority notification will automatically be published to inform visitors about the submission opportunity. {contentLink ? "The notification will include the submission link and expire on the deadline." : "The notification will expire on the deadline."}
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Info (Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert variant="outline">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Debug Mode:</strong> Detailed error messages and technical information will be shown in development. Check browser console for detailed logs.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>{cfp ? "Edit Call for Papers" : "Create Call for Papers"}</CardTitle>
          <CardDescription>
            {cfp
              ? "Update the details for your call for papers."
              : "Create a new call for papers for your journal. You can optionally include submission instructions or links."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter call for papers title" 
                          {...field} 
                          maxLength={200}
                        />
                      </FormControl>
                      <FormDescription>
                        This will also be used as the notification title (5-200 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thematicFocus"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Thematic Focus *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter the thematic focus" 
                          {...field} 
                          maxLength={100}
                        />
                      </FormControl>
                      <FormDescription>
                        Brief description of the main theme (3-100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a detailed description of the call for papers"
                          className="min-h-[120px]"
                          {...field}
                          maxLength={2000}
                        />
                      </FormControl>
                      <FormDescription>
                        This description will be included in the auto-generated notification (20-2000 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentLink"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Submission Link (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://easychair.org/conferences/?conf=yourconf or https://example.com/submit" 
                            {...field} 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Optional link to submission system, detailed call for papers, or submission instructions. If provided, this will be included in notifications.
                      </FormDescription>
                      <FormMessage />
                      {contentLink && contentLink.trim() !== '' && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <ExternalLink className="h-3 w-3" />
                          <a 
                            href={contentLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline"
                          >
                            Preview link
                          </a>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Deadline *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
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
                        Must be in the future. The notification will automatically expire on this date.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="999" {...field} />
                      </FormControl>
                      <FormDescription>1-999</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="99" {...field} />
                      </FormControl>
                      <FormDescription>1-99</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1900" max="2100" {...field} />
                      </FormControl>
                      <FormDescription>1900-2100</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Fee (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., $50 USD" 
                          {...field} 
                          maxLength={50}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty if there's no submission fee (max 50 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Email or contact details" 
                          {...field} 
                          maxLength={100}
                        />
                      </FormControl>
                      <FormDescription>Max 100 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Cover Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        This image will also be used in the notification. Must start with http or https.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormLabel>Topics (Max 10)</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a topic"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                        maxLength={50}
                      />
                      <Button type="button" onClick={addTopic} size="sm" disabled={topics.length >= 10}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {topic}
                            <button
                              type="button"
                              onClick={() => removeTopic(topic)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Topics will be featured in the notification (first 3 shown). {10 - topics.length} remaining.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="guidelines"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Submission Guidelines *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter detailed submission guidelines"
                          className="min-h-[120px]"
                          {...field}
                          maxLength={5000}
                        />
                      </FormControl>
                      <FormDescription>
                        {isEditing 
                          ? "Detailed instructions for authors (required - minimum 1 character, recommended 50+ for comprehensive guidelines)"
                          : "Detailed instructions for authors (minimum 50 characters for new call for papers)"
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eligibility"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Eligibility Criteria (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter eligibility criteria for submissions"
                          className="min-h-[80px]"
                          {...field}
                          maxLength={1000}
                        />
                      </FormControl>
                      <FormDescription>
                        Who can submit papers (max 1000 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {cfp ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {!cfp && <Bell className="mr-2 h-4 w-4" />}
                      {cfp ? "Update Call for Papers" : "Create Call for Papers & Notification"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}