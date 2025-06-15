"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { MediaSelector } from "@/components/admin/media-selector"
import { Badge } from "@/components/ui/badge"
import type { BoardAdvisor } from "@/lib/types"

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
  expertise: z.array(z.string()).optional(),
})

interface BoardAdvisorFormProps {
  advisor?: BoardAdvisor
}

export function BoardAdvisorForm({ advisor }: BoardAdvisorFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>(advisor?.image || "")
  const [expertiseInput, setExpertiseInput] = useState("")
  const [expertise, setExpertise] = useState<string[]>(advisor?.expertise || [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: advisor?.name || "",
      designation: advisor?.designation || "",
      bio: advisor?.bio || "",
      email: advisor?.email || "",
      image: advisor?.image || "",
      order: advisor?.order || 999, // Default to end of list
      expertise: advisor?.expertise || [],
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    // In a real application, you would save the advisor to your database
    setTimeout(() => {
      setIsSubmitting(false)

      toast({
        title: advisor ? "Advisor updated" : "Advisor added",
        description: `"${values.name}" has been ${advisor ? "updated" : "added"} successfully.`,
      })

      router.push("/admin/board-advisors")
    }, 1500)
  }

  function handleImageSelect(url: string) {
    setSelectedImage(url)
    form.setValue("image", url)
  }

  function addExpertise() {
    if (expertiseInput.trim() !== "" && !expertise.includes(expertiseInput.trim())) {
      const newExpertise = [...expertise, expertiseInput.trim()]
      setExpertise(newExpertise)
      form.setValue("expertise", newExpertise)
      setExpertiseInput("")
    }
  }

  function removeExpertise(item: string) {
    const newExpertise = expertise.filter((i) => i !== item)
    setExpertise(newExpertise)
    form.setValue("expertise", newExpertise)
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
                    <Input placeholder="Enter advisor name" {...field} />
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
                    <Input placeholder="Enter advisor designation" {...field} />
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
                    <Input placeholder="Enter advisor email" {...field} />
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
                    <Textarea placeholder="Enter advisor bio" className="resize-none h-32" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expertise"
              render={() => (
                <FormItem>
                  <FormLabel>Areas of Expertise</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {expertise.map((item) => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
                        {item}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeExpertise(item)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {item}</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={expertiseInput}
                      onChange={(e) => setExpertiseInput(e.target.value)}
                      placeholder="Add area of expertise"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addExpertise()
                        }
                      }}
                    />
                    <Button type="button" onClick={addExpertise}>
                      Add
                    </Button>
                  </div>
                  <FormDescription>Press Enter or click Add to add multiple areas of expertise.</FormDescription>
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
          <Button type="button" variant="outline" onClick={() => router.push("/admin/board-advisors")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {advisor ? "Update" : "Add"} Advisor
          </Button>
        </div>
      </form>
    </Form>
  )
}
