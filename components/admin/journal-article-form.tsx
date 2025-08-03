"use client"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon, Loader2, Plus, X, FileText, AlertTriangle, Mail, BookOpen, UserPlus, Users, ExternalLink, Link as LinkIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { 
  createJournalArticle, 
  updateJournalArticle, 
  getJournalIssuesForDropdown 
} from "@/lib/actions/journal-article-actions"
import { format } from "date-fns"

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

// Updated schema for journal articles (no content/image, focus on metadata)
const formSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  abstract: z.string()
    .min(1, "Abstract is required")
    .min(20, "Abstract must be at least 20 characters"),
  contentLink: z.string()
    .min(1, "Content link is required for journal articles")
    .url("Please enter a valid URL"),
  publishedAt: z.date({ required_error: "Publication date is required" }),
  readTime: z.coerce.number()
    .min(1, "Read time must be at least 1 minute")
    .max(180, "Read time must be less than 180 minutes")
    .int("Read time must be a whole number"),
  authors: z.array(authorSchema)
    .min(1, "At least one author is required")
    .max(10, "Maximum 10 authors allowed"),
  issueId: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
  featured: z.boolean().default(false),
  carousel: z.boolean().default(false),
})

type FormData = z.infer<typeof formSchema>
type Author = z.infer<typeof authorSchema>

interface JournalArticleFormProps {
  article?: {
    id: string
    slug: string
    title: string
    abstract?: string
    contentLink?: string
    publishedAt?: Date | string
    readTime: number
    issueId?: string | null
    keywords: string[]
    archived?: boolean
    featured?: boolean
    carousel?: boolean
    Authors?: Array<{
      id: string
      name: string
      email: string
    }> | null
    journalIssue?: {
      id: string
      volume: number
      issue: number
      year: number
      theme?: string
    } | null
  }
}

export function JournalArticleForm({ article }: JournalArticleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [journalIssues, setJournalIssues] = useState<Array<{ 
    id: string; 
    volume: number; 
    issue: number; 
    year: number; 
    theme?: string 
  }>>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [newAuthor, setNewAuthor] = useState<Author>({ name: "", email: "" })

  // Load journal issues
  useEffect(() => {
    async function loadData() {
      const issuesResult = await getJournalIssuesForDropdown()
      
      if (issuesResult.issues) {
        setJournalIssues(issuesResult.issues)
      }
    }
    loadData()
  }, [])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: article?.title || "",
      slug: article?.slug || "",
      abstract: article?.abstract || "",
      contentLink: article?.contentLink || "",
      publishedAt: article?.publishedAt ? new Date(article.publishedAt) : new Date(),
      readTime: article?.readTime || 5,
      authors: article?.Authors?.map(author => ({
        name: author.name,
        email: author.email,
      })) || [{ name: "", email: "" }],
      issueId: article?.journalIssue?.id || article?.issueId || "",
      keywords: article?.keywords || [],
      archived: article?.archived || false,
      featured: article?.featured || false,
      carousel: article?.carousel || false,
    },
  })

  const keywords = form.watch("keywords")
  const title = form.watch("title")
  const authors = form.watch("authors")
  const contentLink = form.watch("contentLink")

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !article) { // Only auto-generate for new articles
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      form.setValue("slug", slug)
    }
  }, [title, form, article])

  // Author management functions
  const addAuthor = () => {
    const trimmedAuthor = {
      name: newAuthor.name.trim(),
      email: newAuthor.email.trim().toLowerCase()
    }
    
    const authorValidation = authorSchema.safeParse(trimmedAuthor)
    if (!authorValidation.success) {
      const errors = authorValidation.error.errors.map(err => err.message).join(', ')
      toast({
        title: "Invalid Author",
        description: errors,
        variant: "destructive",
      })
      return
    }

    const existingAuthor = authors.find(author => 
      author.email.toLowerCase() === trimmedAuthor.email
    )
    if (existingAuthor) {
      toast({
        title: "Duplicate Author",
        description: "An author with this email already exists.",
        variant: "destructive",
      })
      return
    }

    // if (authors.length >= 10) {
    //   toast({
    //     title: "Too many authors",
    //     description: "You can add a maximum of 10 authors.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    form.setValue("authors", [...authors, trimmedAuthor])
    setNewAuthor({ name: "", email: "" })
    
    toast({
      title: "Author Added",
      description: `${trimmedAuthor.name} has been added as an author.`,
    })
  }

  const removeAuthor = (indexToRemove: number) => {
    if (authors.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one author is required.",
        variant: "destructive",
      })
      return
    }
    
    const updatedAuthors = authors.filter((_, index) => index !== indexToRemove)
    form.setValue("authors", updatedAuthors)
  }

  const updateAuthor = (index: number, field: keyof Author, value: string) => {
    const updatedAuthors = [...authors]
    updatedAuthors[index] = { ...updatedAuthors[index], [field]: value }
    form.setValue("authors", updatedAuthors)
  }

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

  const formatErrorMessage = (error: any): { title: string; description: string } => {
    if (typeof error === 'string') {
      if (error.includes('Unauthorized')) {
        return {
          title: "Permission Denied",
          description: "You don't have permission to manage journal articles. Please contact an administrator."
        }
      }
      if (error.includes('slug already exists')) {
        return {
          title: "Duplicate Slug",
          description: "An article with this slug already exists. Please use a different slug."
        }
      }
      return {
        title: "Error",
        description: error
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
      
      const result = article
        ? await updateJournalArticle(article.slug, data)
        : await createJournalArticle(data)

      console.log("📥 Server response:", result)

      if (result.success) {
        console.log("✅ Operation successful!")
        
        toast({
          title: article ? "✅ Article Updated" : "🎉 Article Created!",
          description: article 
            ? `"${data.title}" has been updated successfully.`
            : `"${data.title}" has been created successfully. ${data.archived ? "It's saved as archived." : "It's now published."}`,
          duration: 4000,
        })
        
        console.log("🔄 Redirecting to admin page...")
        router.push("/admin/journal-articles")
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
        description: errorInfo.description,
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
      {!article && (
        <Alert>
          <LinkIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Journal Article:</strong> This form creates a reference to an external journal article. Provide the link to where the full article can be accessed (DOI, PDF, academic platform, etc.).
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Info (Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert variant="outline">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Debug Mode:</strong> Detailed error messages and technical information will be shown in development.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>{article ? "Edit Journal Article" : "Create Journal Article Reference"}</CardTitle>
          <CardDescription>
            {article
              ? "Update the metadata for your journal article reference."
              : "Create a new journal article reference. This will link to the external publication."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Article Information</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter article title" 
                            {...field} 
                            maxLength={200}
                          />
                        </FormControl>
                        <FormDescription>
                          The main title of the journal article (5-200 characters)
                        </FormDescription>
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
                          <Input 
                            placeholder="article-url-slug" 
                            {...field} 
                            maxLength={100}
                          />
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
                    name="readTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Read Time (minutes) *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="180" {...field} />
                        </FormControl>
                        <FormDescription>
                          Estimated reading time in minutes (1-180)
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
                        <FormLabel>Full Article Link *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="https://arxiv.org/abs/paper-id or https://example.com/article.pdf" 
                              {...field} 
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Link to the full article content (PDF, arxiv, PubMed, institutional repository, etc.). This is required for journal articles.
                        </FormDescription>
                        <FormMessage />
                        {contentLink && (
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
                    name="issueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Journal Issue (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a journal issue" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {journalIssues.map((issue) => (
                              <SelectItem key={issue.id} value={issue.id}>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  <span>
                                    Vol. {issue.volume}, No. {issue.issue} ({issue.year})
                                    {issue.theme && ` - ${issue.theme}`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Assign this article to a journal issue
                        </FormDescription>
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
                        <FormDescription>
                          When this article was/will be published
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
                      <FormLabel>Abstract *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a brief summary of the article"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Brief summary or introduction (20-500 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Authors Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Authors</h3>
                  <Badge variant="secondary">{authors.length}/10</Badge>
                </div>

                {/* Current Authors */}
                <div className="space-y-4">
                  {authors.map((author, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Author Name *</label>
                            <Input
                              placeholder="Enter author's full name"
                              value={author.name}
                              onChange={(e) => updateAuthor(index, 'name', e.target.value)}
                              maxLength={100}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Author Email *</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="author@example.com"
                                type="email"
                                value={author.email}
                                onChange={(e) => updateAuthor(index, 'email', e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAuthor(index)}
                          disabled={authors.length <= 1}
                          className="mt-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {/* Add New Author */}
                  {authors.length < 10 && (
                    <Card className="p-4 border-dashed">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <UserPlus className="h-4 w-4" />
                          Add New Author
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Enter author's full name"
                            value={newAuthor.name}
                            onChange={(e) => setNewAuthor(prev => ({ ...prev, name: e.target.value }))}
                            maxLength={100}
                          />
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="author@example.com"
                              type="email"
                              value={newAuthor.email}
                              onChange={(e) => setNewAuthor(prev => ({ ...prev, email: e.target.value }))}
                              className="pl-10"
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAuthor())}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={addAuthor}
                          size="sm"
                          disabled={!newAuthor.name.trim() || !newAuthor.email.trim()}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Author
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>

                <FormMessage>
                  {form.formState.errors.authors?.message}
                </FormMessage>

                <p className="text-sm text-muted-foreground">
                  Add all authors for this article. If an author doesn't exist in the system, they will be created automatically based on their email address. {10 - authors.length} authors remaining.
                </p>
              </div>

              {/* Metadata & Settings */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Metadata & Settings</h3>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="archived"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Archived
                          </FormLabel>
                          <FormDescription>
                            Archive this article
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
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
                          <FormLabel className="text-base">
                            Featured
                          </FormLabel>
                          <FormDescription>
                            Feature this article
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
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
                          <FormLabel className="text-base">
                            Carousel
                          </FormLabel>
                          <FormDescription>
                            Show in carousel
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
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
                      {article ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      {article ? "Update Article" : "Create Article"}
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