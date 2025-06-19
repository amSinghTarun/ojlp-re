// components/admin/role-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { Loader2, ArrowLeft, Save, Shield, Users } from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

// Types
import type { Role, Permission } from "@prisma/client"

// Extended types
interface RoleWithDetails extends Role {
  userCount: number
  permissionCount: number
  permissionNames: string[]
  isSystemRole: boolean
  canEdit: boolean
  users: Array<{
    id: string
    name: string
    email: string
  }>
  permissions: Array<{
    permission: Permission
  }>
}

// Form validation schema
const roleFormSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name is too long" }),
  description: z.string()
    .max(255, { message: "Description is too long" })
    .optional(),
  permissionIds: z.array(z.string()).optional(),
})

interface RoleFormProps {
  role?: RoleWithDetails
  availablePermissions: Permission[]
  mode: "create" | "edit"
}

export function RoleForm({ role, availablePermissions, mode }: RoleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if this is a system role
  const isSystemRole = role?.isSystemRole || false
  const isSuperAdminRole = role?.name === "Super Admin"

  // Initialize form
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissionIds: role?.permissions.map(rp => rp.permission.id) || [],
    },
  })

  // Reset form when role prop changes (for edit mode)
  useEffect(() => {
    if (role && mode === "edit") {
      form.reset({
        name: role.name,
        description: role.description || "",
        permissionIds: role.permissions.map(rp => rp.permission.id),
      })
    }
  }, [role, mode, form])

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof roleFormSchema>) => {
    setIsSubmitting(true)

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append("name", data.name.trim())
      
      if (data.description && data.description.trim() !== "") {
        formData.append("description", data.description.trim())
      }

      // Add permission IDs
      if (data.permissionIds && data.permissionIds.length > 0) {
        data.permissionIds.forEach(id => {
          formData.append("permissionIds", id)
        })
      }

      let result

      if (mode === "edit" && role) {
        // Update existing role
        const { updateRole } = await import("@/lib/actions/role-actions")
        result = await updateRole(role.id, formData)
      } else {
        // Create new role
        const { createRole } = await import("@/lib/actions/role-actions")
        result = await createRole(formData)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: mode === "edit" ? "Role updated successfully" : "Role created successfully",
        })
        router.push("/admin/roles")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save role",
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

  // Group permissions by category for better UX
  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    const category = permission.name.split('_')[0] // e.g., 'manage', 'view'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  // Get readable permission name
  const getPermissionDisplayName = (permissionName: string) => {
    return permissionName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    const categoryNames: Record<string, string> = {
      'manage': 'Management',
      'view': 'Viewing',
      'assign': 'Assignment',
      'create': 'Creation',
      'edit': 'Editing',
      'delete': 'Deletion'
    }
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/roles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? `Edit Role: ${role?.name}` : "Create New Role"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "edit" 
              ? "Update role information and permissions" 
              : "Create a new role with specific permissions"
            }
          </p>
        </div>
      </div>

      {/* System Role Warning */}
      {isSystemRole && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {isSuperAdminRole 
              ? "This is the Super Admin role. Some properties cannot be modified to maintain system security."
              : "This is a system role. Modifications may be limited."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Current Role Info (Edit Mode Only) */}
      {mode === "edit" && role && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Current Role Information
              {role.isSystemRole && <Shield className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Users Assigned:</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{role.userCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Permissions:</span>
              <Badge variant="outline">{role.permissionCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type:</span>
              <Badge variant={role.isSystemRole ? "destructive" : "secondary"}>
                {role.isSystemRole ? "System" : "Custom"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(role.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Role Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter role name" 
                            {...field} 
                            disabled={isSubmitting || (isSuperAdminRole && mode === "edit")}
                          />
                        </FormControl>
                        <FormDescription>
                          {isSuperAdminRole && mode === "edit" 
                            ? "Super Admin role name cannot be changed"
                            : "A unique name for this role"
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this role is for..." 
                            {...field} 
                            disabled={isSubmitting}
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of the role's purpose and responsibilities
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
                          {mode === "edit" ? "Update Role" : "Create Role"}
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
            </CardContent>
          </Card>
        </div>

        {/* Permissions Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isSuperAdminRole 
                  ? "Super Admin has all permissions by default"
                  : "Select which permissions this role should have"
                }
              </p>
            </CardHeader>
            <CardContent>
              {isSuperAdminRole ? (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Super Admin role automatically has all permissions and cannot be modified.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {Object.keys(groupedPermissions).length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No permissions available</p>
                      </div>
                    ) : (
                      Object.entries(groupedPermissions).map(([category, permissions], categoryIndex) => (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">
                              {getCategoryDisplayName(category)}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {permissions.length}
                            </Badge>
                          </div>
                          <div className="space-y-3 pl-4">
                            {permissions.map((permission) => (
                              <FormField
                                key={permission.id}
                                control={form.control}
                                name="permissionIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={permission.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(permission.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value || [], permission.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== permission.id
                                                  )
                                                )
                                          }}
                                          disabled={isSubmitting}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none flex-1">
                                        <FormLabel className="text-sm font-normal cursor-pointer">
                                          {getPermissionDisplayName(permission.name)}
                                        </FormLabel>
                                        {permission.description && (
                                          <p className="text-xs text-muted-foreground">
                                            {permission.description}
                                          </p>
                                        )}
                                      </div>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          {categoryIndex !== Object.keys(groupedPermissions).length - 1 && (
                            <Separator className="my-3" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permission Summary */}
          {!isSuperAdminRole && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permission Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Selected Permissions:</span>
                    <Badge variant="outline">
                      {form.watch("permissionIds")?.length || 0}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {form.watch("permissionIds")?.length === 0 ? (
                      "No permissions selected"
                    ) : (
                      `This role will have ${form.watch("permissionIds")?.length} permission${form.watch("permissionIds")?.length === 1 ? '' : 's'}`
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Users (Edit Mode Only) */}
          {mode === "edit" && role && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Users</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {role.users.length === 0 
                    ? "No users assigned to this role"
                    : `${role.users.length} user${role.users.length === 1 ? '' : 's'} assigned`
                  }
                </p>
              </CardHeader>
              <CardContent>
                {role.users.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No users assigned</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {role.users.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}