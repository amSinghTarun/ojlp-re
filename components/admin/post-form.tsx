"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, X, User, CalendarIcon, FileText, ExternalLink } from "lucide-react"

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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { getPost, createPost, updatePost } from "@/lib/actions/post-actions"
import { MediaSelector } from "@/components/admin/media-selector"

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

// Updated schema to match the complete Article model
const formSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  abstract: z.string().optional(),
  content: z.string()
    .min(1, "Content is required"),
  type: z.enum(["blog", "journal"]).default("blog"),
  authors: z.array(authorSchema)
    .min(1, "At least one author is required"),
  publishedAt: z.date({ required_error: "Publication date is required" }),
  readTime: z.number().optional(),
  image: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  contentLink: z.string().optional(),
  // Article-specific fields
  archived: z.boolean().default(false),
  featured: z.boolean().default(false),
  carousel: z.boolean().default(false),
  // Journal-specific fields (conditional)
  issueId: z.string().optional(),
})

interface PostFormProps {
  slug?: string
  type?: "blog" | "journal"
}

export function PostForm({ slug, type = "blog" }: PostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!slug)
  const [newKeyword, setNewKeyword] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      abstract: "",
      content: "",
      type: type,
      authors: [{ name: "", email: "" }],
      publishedAt: new Date(),
      readTime: undefined,
      image: "",
      keywords: [],
      contentLink: "",
      archived: false,
      featured: false,
      carousel: false,
      issueId: "",
    },
  })

  const watchedTitle = form.watch("title")
  const watchedType = form.watch("type")
  const keywords = form.watch("keywords")

  // Auto-generate slug from title for new posts
  useEffect(() => {
    if (watchedTitle && !slug) {
      const generatedSlug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      form.setValue("slug", generatedSlug)
    }
  }, [watchedTitle, form, slug])

  // Load existing post data if editing
  useEffect(() => {
    if (slug) {
      const fetchPost = async () => {
        try {
          setIsLoading(true)
          const result = await getPost(slug)
          if (result.success && result.data) {
            const post = result.data
            
            // Map data to form with proper field handling
            form.reset({
              title: post.title,
              slug: post.slug,
              abstract: post.abstract || post.excerpt || "",
              content: post.content,
              type: post.type as "blog" | "journal",
              authors: post.authors?.map((a: any) => ({
                name: a.author?.name || a.name,
                email: a.author?.email || a.email,
              })) || [{ name: "", email: "" }],
              publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
              readTime: post.readTime || undefined,
              image: post.image || "",
              keywords: post.keywords || [],
              contentLink: post.contentLink || "",
              archived: post.archived ?? false,
              featured: post.featured ?? false,
              carousel: post.carousel ?? false,
              issueId: post.issueId || "",
            })
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

  // Keyword management
  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      if (keywords.length >= 10) {
        toast({
          title: "Too many keywords",
          description: "You can add a maximum of 10 keywords.",
          variant: "destructive",
        })
        return
      }
      form.setValue("keywords", [...keywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    form.setValue("keywords", keywords.filter(keyword => keyword !== keywordToRemove))
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
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter post title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug *</FormLabel>
                  <FormControl>
                    <Input placeholder="post-url-slug" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly version of the title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="blog">Blog Post</option>
                      <option value="journal">Journal Article</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publishedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publication Date *</FormLabel>
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
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="readTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Read Time (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="180" {...field} />
                  </FormControl>
                  <FormDescription>
                    Estimated reading time in minutes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="abstract"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abstract/Excerpt</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter a brief summary"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Brief summary or introduction (max 500 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedType === "journal" && (
            <FormField
              control={form.control}
              name="contentLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Link</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="https://doi.org/10.1000/article or https://example.com/article.pdf" 
                        {...field} 
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Link to the full article content for journal articles
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

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
                  The full content of your post
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Media */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Media</h3>

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {field.value && (
                      <div className="relative w-32 h-24 overflow-hidden rounded">
                        <img
                          src={field.value}
                          alt="Featured image preview"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <MediaSelector onSelect={(url) => field.onChange(url)} />
                  </div>
                </FormControl>
                <FormDescription>
                  Optional featured image for the post
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Settings & Metadata */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Settings & Metadata</h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="archived"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Archived</FormLabel>
                    <FormDescription>
                      Archive this post (hidden from public)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
                      Feature this post on homepage
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carousel"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Carousel</FormLabel>
                    <FormDescription>
                      Show in homepage carousel
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Keywords */}
          <div>
            <FormLabel>Keywords (Max 10)</FormLabel>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a keyword"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  maxLength={50}
                />
                <Button type="button" onClick={addKeyword} size="sm" disabled={keywords.length >= 10}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
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
              Keywords for SEO and search. {10 - keywords.length} remaining.
            </p>
          </div>
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