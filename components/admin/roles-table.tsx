// components/admin/roles-table.tsx
"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Pencil, Trash2, Loader2, RefreshCw, Users, Shield, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { deleteRole } from "@/lib/actions/role-actions"

// Extended role type with computed fields
interface RoleWithStats {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  userCount: number
  permissionCount: number
  permissionNames: string[]
  isSystemRole: boolean
  canEdit: boolean
  canDelete: boolean
  users: Array<{
    id: string
    name: string
    email: string
  }>
  permissions: Array<{
    permission: {
      id: string
      name: string
      description: string | null
    }
  }>
}

interface RolesTableProps {
  initialRoles: RoleWithStats[]
}

export function RolesTable({ initialRoles }: RolesTableProps) {
  const router = useRouter()
  const [roles, setRoles] = useState(initialRoles)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh roles list
  const refreshRoles = useCallback(async () => {
    setIsRefreshing(true)
    try {
      router.refresh()
      toast({
        title: "Refreshed",
        description: "Roles list has been updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh roles list",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [router])

  // Confirm delete action
  const confirmDelete = useCallback((roleId: string) => {
    setSelectedRoleId(roleId)
    setDeleteDialogOpen(true)
  }, [])

  // Handle delete action
  const handleDelete = useCallback(async () => {
    if (!selectedRoleId) return

    setIsDeleting(selectedRoleId)
    
    try {
      const result = await deleteRole(selectedRoleId)
      
      if (result.success) {
        // Remove role from local state
        setRoles(prevRoles => prevRoles.filter(role => role.id !== selectedRoleId))
        
        toast({
          title: "Success",
          description: "Role has been deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the role",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
      setDeleteDialogOpen(false)
      setSelectedRoleId(null)
    }
  }, [selectedRoleId])

  // Get role badge variant based on role type
  const getRoleBadgeVariant = (role: RoleWithStats) => {
    if (role.isSystemRole) {
      return role.name === "Super Admin" ? "destructive" : "default"
    }
    return "secondary"
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  const selectedRole = selectedRoleId ? roles.find(r => r.id === selectedRoleId) : null

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Roles ({roles.length})</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system roles and their permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshRoles}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button asChild>
              <Link href="/admin/roles/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Role
              </Link>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">No roles found</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/roles/new">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create First Role
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    {/* Role Info */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.name}</span>
                          {role.isSystemRole && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Shield className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>System Role</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Users Count */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{role.userCount}</span>
                      </div>
                    </TableCell>

                    {/* Permissions Count */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {role.permissionCount > 0 ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline">
                                {role.permissionCount} permissions
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Permissions:</p>
                                <ul className="text-xs space-y-0.5">
                                  {role.permissionNames.slice(0, 5).map((perm) => (
                                    <li key={perm}>• {perm}</li>
                                  ))}
                                  {role.permissionNames.length > 5 && (
                                    <li>• ... and {role.permissionNames.length - 5} more</li>
                                  )}
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">No permissions</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(role.createdAt)}
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(role)}>
                        {role.isSystemRole ? "System" : "Custom"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Details */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/roles/${role.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Edit */}
                        {role.canEdit && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/roles/${role.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Role</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Delete */}
                        {role.canDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => confirmDelete(role.id)}
                                disabled={isDeleting === role.id}
                              >
                                {isDeleting === role.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Role</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the role{" "}
                <strong>{selectedRole?.name}</strong> and remove all associated permissions.
                {selectedRole?.userCount && selectedRole.userCount > 0 && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                    ⚠️ Warning: This role has {selectedRole.userCount} users assigned. Please reassign them first.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Role"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}