"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import { createJournalIssue, updateJournalIssue } from "@/lib/actions/journal-actions"
import { CalendarIcon, Loader2, BookOpen, Image as ImageIcon, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Enhanced schema matching the database
const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
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
  publishDate: z.string()
    .min(1, "Publish date is required"),
  coverImage: z.string().optional()
})

type FormData = z.infer<typeof formSchema>

interface JournalIssueFormProps {
  issue?: {
    id: string
    title?: string
    description?: string
    volume: number
    issue: number
    year: number
    publishDate: string
    coverImage?: string
  }
}

export function JournalIssueForm({ issue }: JournalIssueFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: issue?.title || "",
      description: issue?.description || "",
      volume: issue?.volume || new Date().getFullYear() - 2020 + 1,
      issue: issue?.issue || 1,
      year: issue?.year || new Date().getFullYear(),
      publishDate: issue?.publishDate || new Date().toISOString().split('T')[0],
      coverImage: issue?.coverImage || "",
    },
  })

  // Enhanced error message formatter
  const formatErrorMessage = (error: any): { title: string; description: string } => {
    console.log("🔍 Formatting error:", error)

    if (typeof error === 'string') {
      if (error.includes('Unauthorized')) {
        return {
          title: "Permission Denied",
          description: "You don't have permission to manage journals. Please contact an administrator."
        }
      }
      if (error.includes('duplicate') || error.includes('already exists')) {
        return {
          title: "Duplicate Entry",
          description: "A journal issue already exists for this volume, issue, and year combination. Please use different values."
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
      return {
        title: "Error",
        description: error
      }
    }

    if (error && typeof error === 'object') {
      if (error.message) {
        return formatErrorMessage(error.message)
      }
      if (error.error) {
        return formatErrorMessage(error.error)
      }
    }

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
      
      const result = issue
        ? await updateJournalIssue(issue.id, data)
        : await createJournalIssue(data)

      console.log("📥 Server response:", result)

      if (result.success) {
        console.log("✅ Operation successful!")
        
        toast({
          title: issue ? "✅ Journal Issue Updated" : "🎉 Journal Issue Created!",
          description: issue 
            ? `"${data.title}" has been updated successfully.`
            : `"${data.title}" has been created successfully. You can now add articles to this issue.`,
          duration: 4000,
        })
        
        console.log("🔄 Redirecting to admin page...")
        router.push("/admin/journals")
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
            <p>{errorInfo.description}</p>
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
      {/* Information Alert */}
      {!issue && (
        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            <strong>New Journal Issue:</strong> After creating this issue, you'll be able to add and manage articles within it. The volume/issue/year combination must be unique.
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
          <CardTitle>{issue ? "Edit Journal Issue" : "Create Journal Issue"}</CardTitle>
          <CardDescription>
            {issue
              ? "Update the details for your journal issue."
              : "Create a new journal issue. You can add articles to it after creation."}
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
                          placeholder="Enter journal issue title" 
                          {...field} 
                          maxLength={200}
                        />
                      </FormControl>
                      <FormDescription>
                        The main title for this journal issue (5-200 characters)
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
                          placeholder="Enter a detailed description of this journal issue"
                          className="min-h-[120px]"
                          {...field}
                          maxLength={2000}
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed description of the journal issue content and theme (20-2000 characters)
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
                      <FormDescription>Volume number (1-999)</FormDescription>
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
                      <FormDescription>Issue number (1-99)</FormDescription>
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
                      <FormDescription>Publication year (1900-2100)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publishDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publish Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>When this issue was/will be published</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Cover Image URL *</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input 
                            placeholder="https://example.com/cover-image.jpg" 
                            {...field} 
                          />
                          {field.value && field.value.startsWith('http') && (
                            <div className="border rounded-lg p-4">
                              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                              <div className="h-32 w-24 relative overflow-hidden rounded">
                                <img
                                  src={field.value}
                                  alt="Cover preview"
                                  className="object-cover w-full h-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        URL for the journal issue cover image. Must start with http or https.
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
                      {issue ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      {issue ? "Update Journal Issue" : "Create Journal Issue"}
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