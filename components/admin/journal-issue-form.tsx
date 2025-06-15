"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { createJournalIssue, updateJournalIssue, type JournalIssueFormData } from "@/lib/actions/journal-actions"
import { MediaSelector } from "@/components/admin/media-selector"
import { MultiSelect } from "@/components/ui/multi-select"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  volume: z.coerce.number().min(1, "Volume must be at least 1"),
  issue: z.coerce.number().min(1, "Issue must be at least 1"),
  year: z.coerce.number().min(1900, "Year must be valid"),
  publishDate: z.string().min(1, "Publish date is required"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  pdfUrl: z.string().optional(),
  articles: z.array(z.string()).optional(),
})

interface JournalIssueFormProps {
  initialData?: JournalIssueFormData
  articles?: { id: string; title: string }[]
}

export function JournalIssueForm({ initialData, articles = [] }: JournalIssueFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.publishDate ? new Date(initialData.publishDate) : undefined,
  )

  const articleOptions = articles.map((article) => ({
    value: article.id,
    label: article.title,
  }))

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      volume: initialData?.volume || 1,
      issue: initialData?.issue || 1,
      year: initialData?.year || new Date().getFullYear(),
      publishDate: initialData?.publishDate || "",
      description: initialData?.description || "",
      coverImage: initialData?.coverImage || "",
      pdfUrl: initialData?.pdfUrl || "",
      articles: initialData?.articles || [],
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      if (initialData?.id) {
        // Update existing issue
        const result = await updateJournalIssue(initialData.id, values)
        if (result.success) {
          toast({
            title: "Journal issue updated",
            description: "Your changes have been saved.",
          })
          router.push("/admin/journals")
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update journal issue",
            variant: "destructive",
          })
        }
      } else {
        // Create new issue
        const result = await createJournalIssue(values)
        if (result.success) {
          toast({
            title: "Journal issue created",
            description: "The new issue has been created.",
          })
          router.push("/admin/journals")
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create journal issue",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Spring 2023 Issue" {...field} />
                </FormControl>
                <FormDescription>The title of the journal issue.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="volume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input type="number" min={1900} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="publishDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Publish Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"))
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>The date when this issue was published.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A brief description of this journal issue..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Provide a brief description of this journal issue.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image</FormLabel>
                <FormControl>
                  <MediaSelector value={field.value || ""} onChange={field.onChange} filter="image" />
                </FormControl>
                <FormDescription>Select a cover image for this journal issue.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pdfUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PDF URL</FormLabel>
                <FormControl>
                  <MediaSelector value={field.value || ""} onChange={field.onChange} filter="document" />
                </FormControl>
                <FormDescription>Select a PDF file for this journal issue.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="articles"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Articles</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={articleOptions}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select articles to include in this issue"
                  />
                </FormControl>
                <FormDescription>Select the articles to include in this journal issue.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/journals")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Update Issue" : "Create Issue"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
