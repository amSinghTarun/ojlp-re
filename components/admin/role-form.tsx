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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { createRole, updateRole } from "@/lib/actions/role-actions"
import { getAllPermissions } from "@/lib/permissions"

// Form validation schema
const roleFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

interface RoleFormProps {
  role?: {
    id: string
    name: string
    description: string
    isSystem: boolean
    permissionNames: string[]
  }
}

export function RoleForm({ role }: RoleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availablePermissions, setAvailablePermissions] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Check if this is the Super Admin role
  const isSuperAdminRole = role?.name === "Super Admin"

  // Initialize form with default values or existing role data
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissionNames || [],
    },
  })

  // Fetch available permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true)
        const allPermissions = getAllPermissions()
        setAvailablePermissions(allPermissions)
      } catch (error) {
        console.error("Failed to fetch permissions:", error)
        toast({
          title: "Error",
          description: "Failed to load permissions",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  const onSubmit = async (data: z.infer<typeof roleFormSchema>) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", data.name)

      if (data.description) {
        formData.append("description", data.description)
      }

      // For Super Admin role, include all permissions automatically
      if (isSuperAdminRole) {
        availablePermissions.forEach((permission) => {
          formData.append("permissions", permission.id)
        })
      } else if (data.permissions) {
        data.permissions.forEach((permission) => {
          formData.append("permissions", permission)
        })
      }

      let result

      if (role) {
        // Update existing role
        result = await updateRole(role.id, formData)
      } else {
        // Create new role
        result = await createRole(formData)
      }

      if (!result.success) {
        // Handle validation errors
        if (result.errors) {
          const errors = result.errors

          // Set form errors
          Object.keys(errors).forEach((key) => {
            if (key === "_form") {
              toast({
                title: "Error",
                description: errors._form[0],
                variant: "destructive",
              })
            } else {
              form.setError(key as any, {
                type: "manual",
                message: errors[key][0],
              })
            }
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to save role",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Success",
          description: role ? "Role updated successfully" : "Role created successfully",
        })
        router.push("/admin/roles")
        router.refresh()
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
                    <Input
                      placeholder="Role name"
                      {...field}
                      disabled={isSuperAdminRole} // Disable name field for Super Admin
                    />
                  </FormControl>
                  <FormDescription>
                    {isSuperAdminRole
                      ? "The Super Admin role name cannot be changed."
                      : "A descriptive name for this role."}
                  </FormDescription>
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
                    <Textarea placeholder="Role description" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>A brief description of this role's purpose.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSuperAdminRole ? (
              <div className="rounded-md border p-4 bg-muted/50">
                <h3 className="font-medium mb-2">Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  The Super Admin role automatically has all permissions in the system.
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Permissions</FormLabel>
                      <FormDescription>Select the permissions this role should have.</FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availablePermissions.map((permission) => (
                        <FormField
                          key={permission.id}
                          control={form.control}
                          name="permissions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={permission.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), permission.id])
                                        : field.onChange(field.value?.filter((value) => value !== permission.id))
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-medium">{permission.name}</FormLabel>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/roles")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : role ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
