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
import type { EditorialBoardMember } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  designation: z.string().min(2, {
    message: "Designation must be at least 2 characters.",
  }),
  bio: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  image: z.string().min(1, {
    message: "Please select an image.",
  }),
  order: z.coerce.number().int().positive({
    message: "Order must be a positive number.",
  }),
})

interface EditorialBoardFormProps {
  member?: EditorialBoardMember
}

export function EditorialBoardForm({ member }: EditorialBoardFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>(member?.image || "")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name || "",
      designation: member?.designation || "",
      bio: member?.bio || "",
      email: member?.email || "",
      image: member?.image || "",
      order: member?.order || 999, // Default to end of list
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    // In a real application, you would save the member to your database
    setTimeout(() => {
      setIsSubmitting(false)

      toast({
        title: member ? "Member updated" : "Member added",
        description: `"${values.name}" has been ${member ? "updated" : "added"} successfully.`,
      })

      router.push("/admin/editorial-board")
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter member name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter member designation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter member email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormDescription>Lower numbers appear first in the list.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter member bio" className="resize-none h-32" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <MediaSelector onSelect={handleImageSelect} selectedImage={selectedImage} />
                      <Input type="hidden" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/editorial-board")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {member ? "Update" : "Add"} Member
          </Button>
        </div>
      </form>
    </Form>
  )
}
