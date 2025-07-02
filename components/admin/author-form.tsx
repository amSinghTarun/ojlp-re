// components/admin/author-form.tsx - Updated for actual schema
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getAuthorDetail, createNewAuthor, updateExistingAuthor } from "@/lib/actions/author-actions"

// Form schema matching the actual Author model (only name, email, title, bio)
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  title: z.string().optional(),
  bio: z.string().optional(),
})

interface AuthorFormProps {
  slug?: string  // For editing existing authors (undefined for new authors)
}

export function AuthorForm({ slug }: AuthorFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!slug)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      bio: "",
    },
  })

  // Load existing author data if editing
  useEffect(() => {
    if (slug) {
      async function fetchAuthor() {
        try {
          const result = await getAuthorDetail(slug)
          if (result.success && result.data) {
            const author = result.data
            
            // Populate form with existing data
            form.setValue("name", author.name || "")
            form.setValue("email", author.email || "")
            form.setValue("title", author.title || "")
            form.setValue("bio", author.bio || "")
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to load author",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Failed to fetch author:", error)
          toast({
            title: "Error",
            description: "Failed to load author. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchAuthor()
    } else {
      setIsLoading(false)
    }
  }, [slug, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // Clean the data before submission
      const cleanedData = {
        ...values,
        // Remove empty strings and convert to undefined for optional fields
        title: values.title?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
      }

      console.log("📤 Submitting cleaned author data:", cleanedData)

      if (slug) {
        // Update existing author
        const result = await updateExistingAuthor(slug, cleanedData)
        if (result.success) {
          toast({
            title: "Author updated",
            description: "The author has been updated successfully.",
          })
          router.push("/admin/authors")
        } else {
          console.error("Update failed:", result.error)
          toast({
            title: "Error",
            description: Array.isArray(result.error) 
              ? result.error.map(e => e.message).join(", ")
              : (result.error as string) || "Failed to update author",
            variant: "destructive",
          })
        }
      } else {
        // Create new author
        const result = await createNewAuthor(cleanedData)
        if (result.success) {
          toast({
            title: "Author created",
            description: "The author has been created successfully.",
          })
          router.push("/admin/authors")
        } else {
          console.error("Creation failed:", result.error)
          toast({
            title: "Error",
            description: Array.isArray(result.error) 
              ? result.error.map(e => e.message).join(", ")
              : (result.error as string) || "Failed to create author",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to save author:", error)
      toast({
        title: "Error",
        description: "Failed to save author. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading author...</span>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-1 max-w-2xl">
          {/* Basic Information */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter author name"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Full name of the author
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="author@example.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Primary email address for the author
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Professor of Law, Senior Attorney"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Professional title or position
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Biography</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief biography of the author..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief description of the author's background
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {slug ? "Updating..." : "Creating..."}
              </>
            ) : (
              slug ? "Update Author" : "Create Author"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}