"use client"

import { useState } from "react"
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
import { MediaSelector } from "@/components/admin/media-selector"
import type { CallForPapers } from "@/lib/types"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  thematicFocus: z.string().min(5, {
    message: "Thematic focus must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  volume: z.coerce.number().min(1, {
    message: "Volume must be at least 1.",
  }),
  issue: z.coerce.number().min(1, {
    message: "Issue must be at least 1.",
  }),
  year: z.coerce.number().min(2000, {
    message: "Year must be at least 2000.",
  }),
  deadline: z.string().min(5, {
    message: "Please provide a deadline.",
  }),
  guidelines: z.string().min(10, {
    message: "Guidelines must be at least 10 characters.",
  }),
  fee: z.string().optional(),
  image: z.string().optional(),
})

interface CallForPapersFormProps {
  cfp?: CallForPapers
}

export function CallForPapersForm({ cfp }: CallForPapersFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>(cfp?.image || "")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: cfp?.title || "",
      thematicFocus: cfp?.thematicFocus || "",
      description: cfp?.description || "",
      volume: cfp?.volume || 1,
      issue: cfp?.issue || 1,
      year: cfp?.year || new Date().getFullYear(),
      deadline: cfp?.deadline || "",
      guidelines: cfp?.guidelines || "",
      fee: cfp?.fee || "None",
      image: cfp?.image || "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    // In a real application, you would save the call for papers to your database
    setTimeout(() => {
      setIsSubmitting(false)

      toast({
        title: cfp ? "Call for papers updated" : "Call for papers created",
        description: `"${values.title}" has been ${cfp ? "updated" : "created"} successfully.`,
      })

      router.push("/admin/call-for-papers")
    }, 1500)
  }

  function handleImageSelect(url: string) {
    setSelectedImage(url)
    form.setValue("image", url)
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
                    <Input placeholder="Enter call for papers title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thematicFocus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thematic Focus</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter thematic focus" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the call for papers"
                      className="resize-none min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-3">
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
                      <Input type="number" min={2000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Deadline</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., October 15, 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Fee</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ₹1500 / $25 or None" {...field} />
                  </FormControl>
                  <FormDescription>Enter "None" if there is no fee.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="guidelines"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Guidelines</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed submission guidelines"
                      className="resize-none min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>Select an image for the call for papers (optional).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/call-for-papers")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {cfp ? "Update" : "Create"} Call for Papers
          </Button>
        </div>
      </form>
    </Form>
  )
}
