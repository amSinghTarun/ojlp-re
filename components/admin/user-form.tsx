"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User, Role } from "@prisma/client"

// Form validation schema
const userFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).optional(),
  roleId: z.string({
    required_error: "Please select a role",
  }),
})

// For new users, password is required
const createUserSchema = userFormSchema.extend({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

interface UserFormProps {
  user?: User & { role: Role }
  currentUser: User & { role: Role }
  availableRoles: Role[]
  mode: "create" | "edit"
}

export function UserForm({ user, currentUser, availableRoles, mode }: UserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter roles based on current user permissions
  const assignableRoles = availableRoles.filter(role => {
    // Super Admin can assign any role
    if (currentUser.role.name === "Super Admin") return true
    
    // Regular admins cannot assign Super Admin roles
    if (role.name === "Super Admin") return false
    
    // For now, admins can assign roles at or below their level
    const roleHierarchy = {
      "Viewer": 1,
      "Author": 2,
      "Editor": 3,
      "Admin": 4,
      "Super Admin": 5,
    }
    
    const currentUserLevel = roleHierarchy[currentUser.role.name as keyof typeof roleHierarchy] || 0
    const targetRoleLevel = roleHierarchy[role.name as keyof typeof roleHierarchy] || 0
    
    return currentUserLevel >= targetRoleLevel
  })

  // Initialize form with appropriate schema and default values
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(mode === "create" ? createUserSchema : userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "", // Don't pre-fill password
      roleId: user?.roleId || "",
    },
  })

  const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
    setIsSubmitting(true)

    try {
      // Check if the selected role is assignable
      const selectedRole = assignableRoles.find(r => r.id === data.roleId)
      if (!selectedRole) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to assign this role",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Prepare form data
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("email", data.email)
      formData.append("roleId", data.roleId)
      
      // Only include password if provided
      if (data.password && data.password.trim() !== "") {
        formData.append("password", data.password)
      }

      let result

      if (mode === "edit" && user) {
        // Update existing user
        const updateUser = (await import("@/lib/actions/user-actions")).updateUser
        result = await updateUser(user.id, formData)
      } else {
        // Create new user
        if (!data.password || data.password.trim() === "") {
          toast({
            title: "Validation Error",
            description: "Password is required for new users",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        
        const createUser = (await import("@/lib/actions/user-actions")).createUser
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "edit" ? `Edit User: ${user?.name}` : "Create New User"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignableRoles.length === 0 ? (
            <Alert>
              <AlertDescription>
                You don't have permission to assign any roles. Contact your administrator.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>The user's full name.</FormDescription>
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
                          placeholder="john.doe@example.com" 
                          type="email" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>The user's email address for login.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {mode === "edit" ? "New Password" : "Password *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            mode === "edit" 
                              ? "Leave blank to keep current password" 
                              : "Enter password"
                          }
                          type="password"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        {mode === "edit" 
                          ? "Leave blank to keep the current password. Must be at least 8 characters if changing." 
                          : "Must be at least 8 characters."
                        }
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
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
                          {assignableRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <span>{role.name}</span>
                                {role.isSystem && (
                                  <span className="text-xs text-muted-foreground">(System)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The user's role determines their permissions in the system.
                        {assignableRoles.length < availableRoles.length && (
                          <span className="block text-amber-600 mt-1">
                            Some roles are not shown due to permission restrictions.
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/users")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === "edit" ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      mode === "edit" ? "Update User" : "Create User"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Permission Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              You can only assign roles that are at or below your permission level.
              {currentUser.role.name === "Super Admin" 
                ? " As a Super Admin, you can assign any role."
                : ` As ${currentUser.role.name}, you cannot assign Super Admin roles.`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Security Note</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              {mode === "edit" 
                ? "When editing a user, leave the password field blank to keep their current password."
                : "New users will need to use the password you set here to log in."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}