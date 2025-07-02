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
  bio: z.string().min(1, {
    message: "Bio is required.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional().or(z.literal("")),
  image: z.string().min(1, {
    message: "Please select an image.",
  }),
  order: z.coerce.number().int().positive({
    message: "Order must be a positive number.",
  }),
  // Schema fields based on actual Prisma model
  expertise: z.array(z.string()).optional(),
  linkedin: z.string().optional().or(z.literal("")),
  orcid: z.string().optional().or(z.literal("")),
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
      email: member?.email || "",
      image: member?.image || "",
      order: member?.order || 999,
      expertise: member?.expertise || [],
      linkedin: member?.linkedin || "",
      orcid: member?.orcid || "",
    },
  })

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return // Prevent multiple submissions
    
    setIsSubmitting(true)

    try {
      let result
      
      const submitData = {
        name: values.name,
        designation: values.designation,
        memberType: values.memberType,
        bio: values.bio,
        email: values.email || undefined,
        image: values.image,
        order: values.order,
        expertise: values.expertise,
        linkedin: values.linkedin || undefined,
        orcid: values.orcid || undefined,
      }
      
      if (member) {
        // Update existing member
        result = await updateBoardMember(member.id, submitData)
      } else {
        // Create new member
        result = await createBoardMember(submitData)
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

  // Handle expertise array management
  const addExpertise = useCallback(() => {
    const currentExpertise = form.getValues("expertise") || []
    form.setValue("expertise", [...currentExpertise, ""])
  }, [form])

  const removeExpertise = useCallback((index: number) => {
    const currentExpertise = form.getValues("expertise") || []
    const newExpertise = currentExpertise.filter((_, i) => i !== index)
    form.setValue("expertise", newExpertise)
  }, [form])

  const updateExpertise = useCallback((index: number, value: string) => {
    const currentExpertise = form.getValues("expertise") || []
    const newExpertise = [...currentExpertise]
    newExpertise[index] = value
    form.setValue("expertise", newExpertise)
  }, [form])

  const expertiseArray = form.watch("expertise") || []

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
                  <FormLabel>Email (Optional)</FormLabel>
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

            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter LinkedIn URL" {...field} />
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
                  <FormLabel>ORCID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ORCID ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expertise Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Areas of Expertise</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addExpertise}>
                  Add Expertise
                </Button>
              </div>
              
              <div className="space-y-2">
                {expertiseArray.map((expertise, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Enter area of expertise"
                      value={expertise}
                      onChange={(e) => updateExpertise(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpertise(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                
                {expertiseArray.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No areas of expertise added yet. Click "Add Expertise" to add some.
                  </p>
                )}
              </div>
            </div>
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