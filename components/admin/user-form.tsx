"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { createUser, updateUser } from "@/lib/actions/user-actions"
import { getRoles } from "@/lib/actions/role-actions"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS, canAssignRole } from "@/lib/permissions"
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

interface UserFormProps {
  user?: User & { role: Role }
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<(User & { role: Role }) | null>(null)
  const [roles, setRoles] = useState<Array<Role & { canAssign: boolean }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get current user and available roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get current user
        const user = await getCurrentUser()
        setCurrentUser(user)

        // Get available roles
        const { roles: availableRoles } = await getRoles()
        if (availableRoles && user) {
          // Check which roles the current user can assign
          const rolesWithPermission = await Promise.all(
            availableRoles.map(async (role) => {
              const canAssign = await canAssignRole(user, role)
              return {
                ...role,
                canAssign,
              }
            }),
          )
          setRoles(rolesWithPermission)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Initialize form with default values or existing user data
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
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
      // Check if the current user can assign this role
      const selectedRole = roles.find((r) => r.id === data.roleId)
      if (!selectedRole || !selectedRole.canAssign) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to assign this role",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      let result

      if (user) {
        // Update existing user
        result = await updateUser(user.id, {
          name: data.name,
          email: data.email,
          ...(data.password && data.password.length > 0 ? { password: data.password } : {}),
          roleId: data.roleId,
        })
      } else {
        // Create new user
        result = await createUser({
          name: data.name,
          email: data.email,
          password: data.password || "defaultpassword", // Fallback password (should never happen with validation)
          roleId: data.roleId,
        })
      }

      if (result.success) {
        toast({
          title: "Success",
          description: user ? "User updated successfully" : "User created successfully",
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
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if current user can manage users
  const canManageUsers = currentUser && hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <p className="text-destructive">You don't have permission to manage users</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" type="email" {...field} />
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
                  <FormLabel>{user ? "New Password" : "Password"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={user ? "Leave blank to keep current password" : "Password"}
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {user ? "Leave blank to keep the current password." : "Must be at least 8 characters."}
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
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id} disabled={!role.canAssign}>
                          {role.name} {role.isSystem ? "(System)" : ""}
                          {!role.canAssign && " (No permission)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>The user's role determines their permissions in the system.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : user ? "Update User" : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
