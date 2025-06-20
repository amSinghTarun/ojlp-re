// components/admin/author-form.tsx - FIXED
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Plus, Trash, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { MediaSelector } from "@/components/admin/media-selector"
import { getAuthorDetail, createNewAuthor, updateExistingAuthor } from "@/lib/actions/author-actions"
import { Badge } from "@/components/ui/badge"

// UPDATED: Fixed form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  slug: z
    .string()
    .min(2, {
      message: "Slug must be at least 2 characters.",
    })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens.",
    }),
  title: z.string().optional(),
  bio: z.string().optional(),
  image: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      orcid: z.string().optional(),
    })
    .optional(),
  // REMOVED: userId field since it's causing issues and should be handled separately
})

interface AuthorFormProps {
  slug?: string  // For editing existing authors (undefined for new authors)
}

export function AuthorForm({ slug }: AuthorFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!slug)
  const [selectedImage, setSelectedImage] = useState("")
  const [expertiseInput, setExpertiseInput] = useState("")
  const [educationInput, setEducationInput] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      slug: "",
      title: "",
      bio: "",
      image: "",
      expertise: [],
      education: [],
      socialLinks: {
        twitter: "",
        linkedin: "",
        email: "",
        orcid: "",
      },
    },
  })

  // Load existing author data if editing
  useEffect(() => {
    if (slug) {
      async function fetchAuthor() {
        try {
          const result = await getAuthorDetail(slug)
          if (result.success && result.data) {
            const author = result.data
            
            // UPDATED: Proper form data population
            form.setValue("name", author.name || "")
            form.setValue("email", author.email || "")
            form.setValue("slug", author.slug || "")
            form.setValue("title", author.title || "")
            form.setValue("bio", author.bio || "")
            form.setValue("image", author.image || "")
            form.setValue("expertise", author.expertise || [])
            form.setValue("education", author.education || [])
            
            // Handle social links properly
            form.setValue("socialLinks", {
              twitter: author.twitter || "",
              linkedin: author.linkedin || "",
              email: author.socialEmail || "",
              orcid: author.orcid || "",
            })
            
            setSelectedImage(author.image || "")
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to load author",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Failed to fetch author:", error)
          toast({
            title: "Error",
            description: "Failed to load author. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchAuthor()
    } else {
      setIsLoading(false)
    }
  }, [slug, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // UPDATED: Clean the data before submission
      const cleanedData = {
        ...values,
        // Remove empty strings and convert to undefined for optional fields
        title: values.title?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
        image: values.image?.trim() || undefined,
        expertise: values.expertise?.filter(item => item.trim()) || [],
        education: values.education?.filter(item => item.trim()) || [],
        socialLinks: {
          twitter: values.socialLinks?.twitter?.trim() || undefined,
          linkedin: values.socialLinks?.linkedin?.trim() || undefined,
          email: values.socialLinks?.email?.trim() || undefined,
          orcid: values.socialLinks?.orcid?.trim() || undefined,
        },
      }

      // Remove socialLinks if all values are undefined
      if (!cleanedData.socialLinks?.twitter && 
          !cleanedData.socialLinks?.linkedin && 
          !cleanedData.socialLinks?.email && 
          !cleanedData.socialLinks?.orcid) {
        cleanedData.socialLinks = undefined
      }

      console.log("📤 Submitting cleaned author data:", cleanedData)

      if (slug) {
        // Update existing author
        const result = await updateExistingAuthor(slug, cleanedData)
        if (result.success) {
          toast({
            title: "Author updated",
            description: "The author has been updated successfully.",
          })
          router.push("/admin/authors")
        } else {
          console.error("Update failed:", result.error)
          toast({
            title: "Error",
            description: Array.isArray(result.error) 
              ? result.error.map(e => e.message).join(", ")
              : (result.error as string) || "Failed to update author",
            variant: "destructive",
          })
        }
      } else {
        // Create new author
        const result = await createNewAuthor(cleanedData)
        if (result.success) {
          toast({
            title: "Author created",
            description: "The author has been created successfully.",
          })
          router.push("/admin/authors")
        } else {
          console.error("Creation failed:", result.error)
          toast({
            title: "Error",
            description: Array.isArray(result.error) 
              ? result.error.map(e => e.message).join(", ")
              : (result.error as string) || "Failed to create author",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to save author:", error)
      toast({
        title: "Error",
        description: "Failed to save author. Please try again.",
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

  function handleImageDelete() {
    setSelectedImage("")
    form.setValue("image", "")
    toast({
      title: "Image removed",
      description: "The profile image has been removed.",
    })
  }

  function generateSlug(name: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    form.setValue("slug", slug)
  }

  function addExpertise() {
    if (expertiseInput.trim()) {
      const currentExpertise = form.getValues("expertise") || []
      if (!currentExpertise.includes(expertiseInput.trim())) {
        form.setValue("expertise", [...currentExpertise, expertiseInput.trim()])
        setExpertiseInput("")
      }
    }
  }

  function removeExpertise(index: number) {
    const currentExpertise = form.getValues("expertise") || []
    form.setValue(
      "expertise",
      currentExpertise.filter((_, i) => i !== index),
    )
  }

  function addEducation() {
    if (educationInput.trim()) {
      const currentEducation = form.getValues("education") || []
      if (!currentEducation.includes(educationInput.trim())) {
        form.setValue("education", [...currentEducation, educationInput.trim()])
        setEducationInput("")
      }
    }
  }

  function removeEducation(index: number) {
    const currentEducation = form.getValues("education") || []
    form.setValue(
      "education",
      currentEducation.filter((_, i) => i !== index),
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading author...</span>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            {/* Basic Information */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter author name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        if (!slug && !form.getValues("slug")) {
                          generateSlug(e.target.value)
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Full name of the author
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="author@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Primary email address for the author
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
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="author-url-slug"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (auto-generated from name)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Professor of Law, Senior Attorney"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Professional title or position
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biography</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief biography of the author..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of the author's background
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            {/* Profile Image */}
            <div>
              <FormLabel>Profile Image</FormLabel>
              <div className="space-y-4">
                {selectedImage ? (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleImageDelete}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-500">No image</span>
                  </div>
                )}
                <MediaSelector onSelect={handleImageSelect} />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <FormLabel>Social Links</FormLabel>
              
              <FormField
                control={form.control}
                name="socialLinks.twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://twitter.com/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialLinks.linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialLinks.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="public@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Public contact email (different from login email)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialLinks.orcid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ORCID ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0000-0000-0000-0000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Academic identifier (ORCID)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Expertise */}
        <div className="space-y-4">
          <FormLabel>Areas of Expertise</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add area of expertise"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
            />
            <Button type="button" onClick={addExpertise} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(form.watch("expertise") || []).map((item, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {item}
                <button
                  type="button"
                  onClick={() => removeExpertise(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="space-y-4">
          <FormLabel>Education</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add education detail"
              value={educationInput}
              onChange={(e) => setEducationInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEducation())}
            />
            <Button type="button" onClick={addEducation} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(form.watch("education") || []).map((item, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {item}
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {slug ? "Updating..." : "Creating..."}
              </>
            ) : (
              slug ? "Update Author" : "Create Author"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}