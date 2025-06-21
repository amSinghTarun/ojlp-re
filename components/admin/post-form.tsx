"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, X, User } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPost, createPost, updatePost } from "@/lib/actions/post-actions"

// Author schema for individual authors
const authorSchema = z.object({
  name: z.string()
    .min(1, "Author name is required")
    .min(2, "Author name must be at least 2 characters")
    .max(100, "Author name must be less than 100 characters"),
  email: z.string()
    .min(1, "Author email is required")
    .email("Please enter a valid email address"),
})

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  type: z.enum(["blog", "journal"]).default("blog"),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
  featured: z.boolean().default(false),
  keywords: z.array(z.string()).optional(),
  doi: z.string().optional(),
  issueId: z.string().optional().nullable(),
})

interface PostFormProps {
  slug?: string
  type?: "blog" | "journal"
}

export function PostForm({ slug, type = "blog" }: PostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!slug)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      type: type,
      authors: [{ name: "", email: "" }],
      featured: false,
      keywords: [],
      doi: "",
      issueId: null,
    },
  })

  // Load existing post data if editing
  useEffect(() => {
    if (slug) {
      const fetchPost = async () => {
        try {
          setIsLoading(true)
          const result = await getPost(slug)
          if (result.success && result.data) {
            const post = result.data
            
            // Reset form with post data
            form.reset({
              title: post.title,
              content: post.content,
              excerpt: post.excerpt || "",
              type: post.type as "blog" | "journal",
              authors: post.authors?.map((a: any) => ({
                name: a.author?.name || a.name,
                email: a.author?.email || a.email,
              })) || [{ name: "", email: "" }],
              featured: post.featured || false,
              keywords: post.keywords || [],
              doi: post.doi || "",
              issueId: post.issueId,
            })
            
            // Set UI state - no longer needed for images
          } else {
            toast({
              title: "Error",
              description: (result.error as string) || "Failed to fetch post",
              variant: "destructive",
            })
            router.push("/admin/posts")
          }
        } catch (error) {
          console.error("Failed to fetch post:", error)
          toast({
            title: "Error",
            description: "Failed to fetch post. Please try again.",
            variant: "destructive",
          })
          router.push("/admin/posts")
        } finally {
          setIsLoading(false)
        }
      }

      fetchPost()
    } else {
      setIsLoading(false)
    }
  }, [slug, form, router])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      if (slug) {
        // Update existing post
        const result = await updatePost(slug, values)
        if (result.success) {
          toast({
            title: "Post updated",
            description: "Your post has been updated successfully.",
          })
          router.push("/admin/posts")
          router.refresh()
        } else {
          toast({
            title: "Error",
            description: (result.error as string) || "Failed to update post",
            variant: "destructive",
          })
        }
      } else {
        // Create new post
        const result = await createPost(values)
        if (result.success) {
          toast({
            title: "Post created",
            description: "Your post has been created successfully.",
          })
          router.push("/admin/posts")
          router.refresh()
        } else {
          toast({
            title: "Error",
            description: (result.error as string) || "Failed to create post",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to save post:", error)
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleImageSelect(url: string) {
    setSelectedImage(url)
    form.setValue("image", url)
  }

  // Author management functions
  const addAuthor = () => {
    const currentAuthors = form.getValues("authors")
    form.setValue("authors", [...currentAuthors, { name: "", email: "" }])
  }

  const removeAuthor = (index: number) => {
    const currentAuthors = form.getValues("authors")
    if (currentAuthors.length > 1) {
      form.setValue("authors", currentAuthors.filter((_, i) => i !== index))
    }
  }

  const updateAuthor = (index: number, field: "name" | "email", value: string) => {
    const currentAuthors = form.getValues("authors")
    const updatedAuthors = [...currentAuthors]
    updatedAuthors[index] = { ...updatedAuthors[index], [field]: value }
    form.setValue("authors", updatedAuthors)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading post...</span>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter post title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Excerpt</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief summary of the post"
                    className="resize-none h-20"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>A short summary that appears in previews.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Authors Section */}
          <FormField
            control={form.control}
            name="authors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Authors</FormLabel>
                <FormControl>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Post Authors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {field.value.map((author, index) => (
                        <div key={index} className="flex gap-2 p-3 border rounded-lg bg-muted/50">
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Input
                                  placeholder="Author name"
                                  value={author.name}
                                  onChange={(e) => updateAuthor(index, "name", e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div className="flex-1">
                                <Input
                                  placeholder="Author email"
                                  type="email"
                                  value={author.email}
                                  onChange={(e) => updateAuthor(index, "email", e.target.value)}
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>
                          {field.value.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAuthor(index)}
                              className="h-8 w-8 p-0 shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAuthor}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Author
                      </Button>
                    </CardContent>
                  </Card>
                </FormControl>
                <FormDescription>
                  Add authors by name and email. If an author doesn't exist, they will be created automatically.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Featured</FormLabel>
                  <FormDescription>
                    Featured posts will appear on the homepage and be highlighted throughout the site.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {type === "journal" && (
            <>
              <FormField
                control={form.control}
                name="doi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DOI</FormLabel>
                    <FormControl>
                      <Input placeholder="10.1000/xyz123" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>Digital Object Identifier for the article.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="keyword1, keyword2, keyword3"
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const keywords = e.target.value
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                          field.onChange(keywords)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated keywords for the article.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Content</h3>
          
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the full post content..."
                    className="min-h-[300px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The full content of your post (minimum 1 character)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center space-x-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {slug ? "Update Post" : "Create Post"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/posts")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}