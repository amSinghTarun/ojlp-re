"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { MediaSelector } from "@/components/admin/media-selector"
import { createBoardMember, updateBoardMember } from "@/lib/actions/editorial-board-actions"
import { EditorialBoardMember } from "@prisma/client"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  designation: z.string().min(2, {
    message: "Designation must be at least 2 characters.",
  }),
  memberType: z.enum(["Editor", "Advisor"], {
    required_error: "Please select a member type.",
  }),
  bio: z.string().optional(),
  detailedBio: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  image: z.string().min(1, {
    message: "Please select an image.",
  }),
  order: z.coerce.number().int().positive({
    message: "Order must be a positive number.",
  }),
  // Additional fields from the schema
  expertise: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  publications: z.array(z.string()).optional(),
  location: z.string().optional(),
  affiliation: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  orcid: z.string().optional(),
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
      memberType: member?.memberType || "Editor",
      bio: member?.bio || "",
      detailedBio: member?.detailedBio || "",
      email: member?.email || "",
      image: member?.image || "",
      order: member?.order || 999,
      expertise: member?.expertise || [],
      education: member?.education || [],
      achievements: member?.achievements || [],
      publications: member?.publications || [],
      location: member?.location || "",
      affiliation: member?.affiliation || "",
      website: member?.website || "",
      twitter: member?.twitter || "",
      linkedin: member?.linkedin || "",
      instagram: member?.instagram || "",
      orcid: member?.orcid || "",
    },
  })

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return // Prevent multiple submissions
    
    setIsSubmitting(true)

    try {
      let result
      
      if (member) {
        // Update existing member
        result = await updateBoardMember(member.id, {
          name: values.name,
          designation: values.designation,
          memberType: values.memberType,
          bio: values.bio,
          detailedBio: values.detailedBio,
          email: values.email,
          image: values.image,
          order: values.order,
          expertise: values.expertise,
          education: values.education,
          achievements: values.achievements,
          publications: values.publications,
          location: values.location,
          affiliation: values.affiliation,
          website: values.website,
          twitter: values.twitter,
          linkedin: values.linkedin,
          instagram: values.instagram,
          orcid: values.orcid,
        })
      } else {
        // Create new member
        result = await createBoardMember({
          name: values.name,
          designation: values.designation,
          memberType: values.memberType,
          bio: values.bio,
          detailedBio: values.detailedBio,
          email: values.email,
          image: values.image,
          order: values.order,
          expertise: values.expertise,
          education: values.education,
          achievements: values.achievements,
          publications: values.publications,
          location: values.location,
          affiliation: values.affiliation,
          website: values.website,
          twitter: values.twitter,
          linkedin: values.linkedin,
          instagram: values.instagram,
          orcid: values.orcid,
        })
      }

      if (result.success) {
        toast({
          title: member ? "Member updated" : "Member added",
          description: `"${values.name}" has been ${member ? "updated" : "added"} successfully.`,
        })
        // Use replace instead of push to prevent back button issues
        router.replace("/admin/editorial-board")
      } else {
        toast({
          title: "Error",
          description: result.error as string,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save member:", error)
      toast({
        title: "Error",
        description: "Failed to save member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [member, router, isSubmitting])

  const handleCancel = useCallback(() => {
    // Use replace to prevent navigation issues
    router.replace("/admin/editorial-board")
  }, [router])

  const handleImageSelect = useCallback((url: string) => {
    setSelectedImage(url)
    form.setValue("image", url)
  }, [form])

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
              name="memberType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Advisor">Advisor</SelectItem>
                    </SelectContent>
                  </Select>
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

            <FormField
              control={form.control}
              name="detailedBio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter detailed member bio" className="resize-none h-40" {...field} />
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

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="affiliation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affiliation</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter affiliation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter website URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter LinkedIn URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Twitter URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Instagram URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orcid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ORCID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ORCID ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
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