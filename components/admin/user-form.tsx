// components/admin/user-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { Loader2, Eye, EyeOff, ArrowLeft, Save } from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

// Types and Utils
import type { User, Role } from "@prisma/client"

// Base form validation schema
const baseUserFormSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name is too long" }),
  email: z.string()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email is too long" }),
  roleId: z.string({
    required_error: "Please select a role",
  }),
  image: z.string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
})

// For create mode: password is required
const createUserSchema = baseUserFormSchema.extend({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password is too long" }),
})

// For edit mode: password is optional
const editUserSchema = baseUserFormSchema.extend({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password is too long" })
    .optional()
    .or(z.literal("")),
})

// Union type for form data
type CreateUserFormData = z.infer<typeof createUserSchema>
type EditUserFormData = z.infer<typeof editUserSchema>
type UserFormData = CreateUserFormData | EditUserFormData

interface UserFormProps {
  user?: User & { role: Role }
  currentUser: User & { role: Role }
  availableRoles: Role[]
  mode: "create" | "edit"
}

export function UserForm({ user, currentUser, availableRoles, mode }: UserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Use different schemas based on mode
  const schema = mode === "create" ? createUserSchema : editUserSchema

  // Initialize form with correct schema
  const form = useForm<UserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      roleId: user?.roleId || "",
      image: user?.image || "",
    },
  })

  // Reset form when user prop changes (for edit mode)
  useEffect(() => {
    if (user && mode === "edit") {
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        roleId: user.roleId,
        image: user.image || "",
      })
    }
  }, [user, mode, form])

  // Handle form submission
  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true)

    try {
      // Check if the selected role is assignable
      const selectedRole = availableRoles.find(r => r.id === data.roleId)
      if (!selectedRole) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to assign this role",
          variant: "destructive",
        })
        return
      }

      // Additional validation for create mode
      if (mode === "create") {
        const createData = data as CreateUserFormData
        if (!createData.password || createData.password.trim() === "") {
          toast({
            title: "Validation Error",
            description: "Password is required for new users",
            variant: "destructive",
          })
          return
        }
      }

      // Prepare form data
      const formData = new FormData()
      formData.append("name", data.name.trim())
      formData.append("email", data.email.trim().toLowerCase())
      formData.append("roleId", data.roleId)
      
      // Only include password if provided and not empty
      if (data.password && data.password.trim() !== "") {
        formData.append("password", data.password)
      }

      // Only include image if provided
      if (data.image && data.image.trim() !== "") {
        formData.append("image", data.image.trim())
      }

      let result

      if (mode === "edit" && user) {
        // Update existing user
        const { updateUser } = await import("@/lib/actions/user-actions")
        result = await updateUser(user.id, formData)
      } else {
        // Create new user
        const createData = data as CreateUserFormData
        if (!createData.password || createData.password.trim() === "") {
          toast({
            title: "Validation Error",
            description: "Password is required for new users",
            variant: "destructive",
          })
          return
        }
        
        const { createUser } = await import("@/lib/actions/user-actions")
        result = await createUser(formData)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: mode === "edit" ? "User updated successfully" : "User created successfully",
        })
        router.push("/admin/users")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get badge variant for roles
  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case "SUPER_ADMIN":
        return "destructive"
      case "Admin":
        return "default"
      case "Editor":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? `Edit User: ${user?.name}` : "Create New User"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "edit" 
              ? "Update user information and role assignments" 
              : "Add a new user to the system with appropriate permissions"
            }
          </p>
        </div>
      </div>

      {/* Current User Info (Edit Mode Only) */}
      {mode === "edit" && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Role:</span>
              <Badge variant={getRoleBadgeVariant(user.role.name)}>
                {user.role.name}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Created:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(user.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "edit" ? "Edit User Details" : "User Details"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableRoles.length === 0 ? (
            <Alert>
              <AlertDescription>
                You don't have permission to assign any roles. Contact your administrator.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full name" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        The user's full display name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter email address" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for authentication and notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password
                        {mode === "create" && <span className="text-red-500 ml-1">*</span>}
                        {mode === "edit" && (
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            (leave empty to keep current password)
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder={mode === "create" ? "Enter password" : "Enter new password (optional)"}
                            {...field} 
                            disabled={isSubmitting}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isSubmitting}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {mode === "create" 
                          ? "Must be at least 8 characters long"
                          : "Leave empty to keep the current password. If provided, must be at least 8 characters long."
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role Field */}
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <Badge variant={getRoleBadgeVariant(role.name)} className="text-xs">
                                  {role.name}
                                </Badge>
                                {role.description && (
                                  <span className="text-sm text-muted-foreground">
                                    - {role.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Determines the user's permissions and access level
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image URL Field */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://example.com/avatar.jpg" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        URL to the user's profile image. If not provided, a default avatar will be generated.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Actions */}
                <div className="flex items-center gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === "edit" ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {mode === "edit" ? "Update User" : "Create User"}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Available Roles Info */}
      {availableRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableRoles.map((role) => (
                <div key={role.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge variant={getRoleBadgeVariant(role.name)}>
                    {role.name}
                  </Badge>
                  <div className="flex-1">
                    {role.description && (
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}