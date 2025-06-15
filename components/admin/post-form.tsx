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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import { MediaSelector } from "@/components/admin/media-selector"
import { AuthorSelector } from "@/components/admin/author-selector"
import { createPost, updatePost, getPost } from "@/lib/actions/post-actions"

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  excerpt: z.string().optional(),
  type: z.enum(["blog", "journal"]),
  image: z.string().optional(),
  authorIds: z.array(z.string()).min(1, {
    message: "At least one author is required.",
  }),
  featured: z.boolean().default(false),
  keywords: z.array(z.string()).optional(),
  doi: z.string().optional(),
  journalIssueId: z.string().optional().nullable(),
})

interface PostFormProps {
  slug?: string
  type?: "blog" | "journal"
}

export function PostForm({ slug, type = "blog" }: PostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!slug)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [selectedAuthors, setSelectedAuthors] = useState<{ id: string; name: string }[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      type: type,
      image: "",
      authorIds: [],
      featured: false,
      keywords: [],
      doi: "",
      journalIssueId: null,
    },
  })

  useEffect(() => {
    if (slug) {
      const fetchPost = async () => {
        try {
          const result = await getPost(slug)
          if (result.success && result.data) {
            const post = result.data
            form.reset({
              title: post.title,
              content: post.content,
              excerpt: post.excerpt || "",
              type: post.type as "blog" | "journal",
              image: post.image || "",
              authorIds: post.authors.map((a) => a.author.id),
              featured: post.featured || false,
              keywords: post.keywords || [],
              doi: post.doi || "",
              journalIssueId: post.journalIssueId,
            })
            setSelectedImage(post.image || "")
            setSelectedAuthors(post.authors.map((a) => ({ id: a.author.id, name: a.author.name })))
          } else {
            toast({
              title: "Error",
              description: (result.error as string) || "Failed to fetch post",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Failed to fetch post:", error)
          toast({
            title: "Error",
            description: "Failed to fetch post. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchPost()
    } else {
      setIsLoading(false)
    }
  }, [slug, form])

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

  function handleAuthorsChange(authors: { id: string; name: string }[]) {
    setSelectedAuthors(authors)
    form.setValue(
      "authorIds",
      authors.map((a) => a.id),
    )
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
        <div className="grid gap-6 md:grid-cols-2">
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

            <FormField
              control={form.control}
              name="authorIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authors</FormLabel>
                  <FormControl>
                    <AuthorSelector selectedAuthors={selectedAuthors} onChange={handleAuthorsChange} />
                  </FormControl>
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
                        <Input placeholder="Digital Object Identifier" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>The Digital Object Identifier for this article.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Add journal issue selector here if needed */}
              </>
            )}
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <MediaSelector onSelect={handleImageSelect} selectedImage={selectedImage} />
                      <Input type="hidden" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>Select a featured image for the post.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Add keywords input here if needed */}
          </div>
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write your post content here..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/posts")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {slug ? "Update" : "Create"} Post
          </Button>
        </div>
      </form>
    </Form>
  )
}
