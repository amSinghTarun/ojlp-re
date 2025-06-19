// components/admin/permission-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { Loader2, ArrowLeft, Save, Key, Users, Shield, AlertTriangle } from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

// Types
import type { Permission } from "@prisma/client"

// Extended types
interface PermissionWithDetails extends Permission {
  roleCount: number
  userCount: number
  roleNames: string[]
  totalAssignments: number
  canDelete: boolean
  affectedUsers?: number
  users: Array<{
    id: string
    name: string
    email: string
  }>
  roles: Array<{
    role: {
      id: string
      name: string
      description: string | null
      users?: Array<{
        id: string
        name: string
        email: string
      }>
    }
  }>
}

// Form validation schema
const permissionFormSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name is too long" })
    .regex(/^[a-z_]+$/, { message: "Name must be lowercase with underscores only (e.g., manage_users)" }),
  description: z.string()
    .max(255, { message: "Description is too long" })
    .optional(),
})

interface PermissionFormProps {
  permission?: PermissionWithDetails
  mode: "create" | "edit"
}

export function PermissionForm({ permission, mode }: PermissionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof permissionFormSchema>>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: permission?.name || "",
      description: permission?.description || "",
    },
  })

  // Reset form when permission prop changes (for edit mode)
  useEffect(() => {
    if (permission && mode === "edit") {
      form.reset({
        name: permission.name,
        description: permission.description || "",
      })
    }
  }, [permission, mode, form])

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof permissionFormSchema>) => {
    setIsSubmitting(true)

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append("name", data.name.trim().toLowerCase())
      
      if (data.description && data.description.trim() !== "") {
        formData.append("description", data.description.trim())
      }

      let result

      if (mode === "edit" && permission) {
        // Update existing permission
        const { updatePermission } = await import("@/lib/actions/permission-actions")
        result = await updatePermission(permission.id, formData)
      } else {
        // Create new permission
        const { createPermission } = await import("@/lib/actions/permission-actions")
        result = await createPermission(formData)
      }

      if (result.success) {
        toast({
          title: "Success",
          description: mode === "edit" ? "Permission updated successfully" : "Permission created successfully",
        })
        router.push("/admin/permissions")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save permission",
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

  // Get readable permission name
  const getPermissionDisplayName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Get role badge variant
  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case "Super Admin":
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/permissions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Permissions
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? `Edit Permission: ${permission?.name}` : "Create New Permission"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "edit" 
              ? "Update permission information and settings" 
              : "Create a new permission for the system"
            }
          </p>
        </div>
      </div>

      {/* Warning for permissions in use */}
      {mode === "edit" && permission && permission.totalAssignments > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This permission is currently assigned to {permission.roleCount} role(s) and {permission.userCount} user(s). 
            Changes may affect system access for {permission.affectedUsers || 0} user(s).
          </AlertDescription>
        </Alert>
      )}

      {/* Current Permission Info (Edit Mode Only) */}
      {mode === "edit" && permission && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-4 w-4" />
              Current Permission Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Display Name:</span>
              <span className="text-sm font-medium">
                {getPermissionDisplayName(permission.name)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Roles Assigned:</span>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{permission.roleCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Direct Users:</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{permission.userCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(permission.createdAt).toLocaleDateString()}
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
              <CardTitle>Permission Details</CardTitle>
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
                        <FormLabel>Permission Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., manage_users, view_dashboard" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Use lowercase letters and underscores only. This is the technical name used in code.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Live Preview */}
                  {form.watch("name") && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium">Display Name Preview:</div>
                      <div className="text-lg">{getPermissionDisplayName(form.watch("name"))}</div>
                    </div>
                  )}

                  {/* Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this permission allows users to do..." 
                            {...field} 
                            disabled={isSubmitting}
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          A clear description of what capabilities this permission grants
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
                          {mode === "edit" ? "Update Permission" : "Create Permission"}
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

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Naming Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Naming Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">Common Prefixes:</div>
                  <ul className="text-muted-foreground space-y-1 mt-1">
                    <li>• <code>manage_</code> - Full CRUD operations</li>
                    <li>• <code>view_</code> - Read-only access</li>
                    <li>• <code>create_</code> - Creation only</li>
                    <li>• <code>edit_</code> - Modification only</li>
                    <li>• <code>delete_</code> - Deletion only</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <div className="font-medium">Examples:</div>
                  <ul className="text-muted-foreground space-y-1 mt-1">
                    <li>• <code>manage_users</code></li>
                    <li>• <code>view_dashboard</code></li>
                    <li>• <code>edit_posts</code></li>
                    <li>• <code>delete_media</code></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Roles (Edit Mode Only) */}
          {mode === "edit" && permission && permission.roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Roles</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Roles that have this permission
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {permission.roles.map((rolePermission) => (
                    <div key={rolePermission.role.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div>
                        <Badge variant={getRoleBadgeVariant(rolePermission.role.name)}>
                          {rolePermission.role.name}
                        </Badge>
                        {rolePermission.role.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {rolePermission.role.description}
                          </p>
                        )}
                      </div>
                      {rolePermission.role.users && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {rolePermission.role.users.length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Direct Users (Edit Mode Only) */}
          {mode === "edit" && permission && permission.users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Direct Users</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Users with this permission assigned directly
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {permission.users.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}