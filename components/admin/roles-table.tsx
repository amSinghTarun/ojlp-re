// components/admin/roles-table.tsx - Updated for simplified schema
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { deleteRole, duplicateRole } from "@/lib/actions/role-permission-actions"
import { Shield, Users, MoreHorizontal, Edit, Trash2, Copy, Plus, Database } from "lucide-react"
import Link from "next/link"

interface Role {
  id: string
  name: string
  description?: string | null
  permissions: string[]
  isSystem?: boolean
  isSystemRole?: boolean
  userCount: number
  users?: Array<{ id: string; name: string; email: string }>
}

interface RolesTableProps {
  initialRoles: Role[]
}

export function RolesTable({ initialRoles }: RolesTableProps) {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteRole = async () => {
    if (!selectedRole) return

    setIsDeleting(true)
    try {
      const result = await deleteRole(selectedRole.id)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Role deleted successfully",
        })
        
        // Remove role from local state
        setRoles(prev => prev.filter(role => role.id !== selectedRole.id))
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete role:", error)
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedRole(null)
    }
  }

  const handleDuplicateRole = async (role: Role) => {
    try {
      const newName = `${role.name} (Copy)`
      const result = await duplicateRole(role.id, newName)
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Role "${newName}" created successfully`,
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to duplicate role:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate role",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeVariant = (role: Role) => {
    if (role.isSystem || role.isSystemRole) {
      return "default"
    }
    return "secondary"
  }

  const getPermissionsBadgeVariant = (count: number) => {
    if (count >= 10) return "destructive"
    if (count >= 5) return "default"
    return "secondary"
  }

  // Helper function to categorize permissions for display
  const getPermissionSummary = (permissions: string[]) => {
    if (!permissions || permissions.length === 0) return { categories: [], systemCount: 0 }
    
    const categories = new Set<string>()
    let systemCount = 0
    
    permissions.forEach(permission => {
      if (permission.startsWith('SYSTEM.')) {
        systemCount++
        categories.add('System')
      } else {
        const [table] = permission.split('.')
        if (table) {
          categories.add(table.charAt(0).toUpperCase() + table.slice(1))
        }
      }
    })
    
    return {
      categories: Array.from(categories).slice(0, 3), // Show max 3 categories
      systemCount,
      total: permissions.length
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>
              Manage user roles and their permissions for different system resources
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/roles/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No roles found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first role to get started with permission management.
              </p>
              <Button asChild>
                <Link href="/admin/roles/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => {
                  const permissionSummary = getPermissionSummary(role.permissions)
                  
                  return (
                    <TableRow key={role.id}>
                      {/* Role Name & Description */}
                      <TableCell>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Role Type */}
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(role)}>
                          {role.isSystem || role.isSystemRole ? "System" : "Custom"}
                        </Badge>
                      </TableCell>

                      {/* User Count */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{role.userCount}</span>
                          {role.userCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Permission Count */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPermissionsBadgeVariant(role.permissions.length)}>
                            {role.permissions.length} permissions
                          </Badge>
                          {permissionSummary.systemCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {permissionSummary.systemCount} system
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Permission Categories */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {permissionSummary.categories.map((category, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                          {permissionSummary.categories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{permissionSummary.categories.length - 3} more
                            </Badge>
                          )}
                          {permissionSummary.categories.length === 0 && (
                            <span className="text-xs text-muted-foreground">No permissions</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/roles/${role.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDuplicateRole(role)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {/* Show permissions details */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                              <Database className="h-4 w-4 mr-2" />
                              {role.permissions.length} permissions
                            </DropdownMenuItem>
                            {/* Delete option for non-system roles without users */}
                            {!(role.isSystem || role.isSystemRole) && role.userCount === 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedRole(role)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? 
              This action cannot be undone.
              {selectedRole?.userCount && selectedRole.userCount > 0 && (
                <div className="mt-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">
                    Warning: This role is assigned to {selectedRole.userCount} user(s). 
                    You must reassign these users to different roles before deletion.
                  </p>
                </div>
              )}
              {selectedRole && (selectedRole.isSystem || selectedRole.isSystemRole) && (
                <div className="mt-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">
                    Warning: This is a system role and cannot be deleted.
                  </p>
                </div>
              )}
              {selectedRole && selectedRole.permissions.length > 0 && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-sm">
                    This role has {selectedRole.permissions.length} permission(s) that will be removed.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole}
              disabled={
                isDeleting || 
                (selectedRole?.userCount && selectedRole.userCount > 0) ||
                (selectedRole && (selectedRole.isSystem || selectedRole.isSystemRole))
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}