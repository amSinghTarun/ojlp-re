// components/admin/permissions-table.tsx
"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  Users, 
  Shield, 
  Eye,
  Key,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { deletePermission } from "@/lib/actions/permission-actions"

// Extended permission type with computed fields
interface PermissionWithStats {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  roleCount: number
  userCount: number
  roleNames: string[]
  totalAssignments: number
  canDelete: boolean
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
    }
  }>
}

interface PermissionsTableProps {
  initialPermissions: PermissionWithStats[]
}

export function PermissionsTable({ initialPermissions }: PermissionsTableProps) {
  const router = useRouter()
  const [permissions, setPermissions] = useState(initialPermissions)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter permissions based on search
  const filteredPermissions = permissions.filter(permission => 
    searchTerm === "" || 
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Refresh permissions list
  const refreshPermissions = useCallback(async () => {
    setIsRefreshing(true)
    try {
      router.refresh()
      toast({
        title: "Refreshed",
        description: "Permissions list has been updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh permissions list",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [router])

  // Confirm delete action
  const confirmDelete = useCallback((permissionId: string) => {
    setSelectedPermissionId(permissionId)
    setDeleteDialogOpen(true)
  }, [])

  // Handle delete action
  const handleDelete = useCallback(async () => {
    if (!selectedPermissionId) return

    setIsDeleting(selectedPermissionId)
    
    try {
      const result = await deletePermission(selectedPermissionId)
      
      if (result.success) {
        // Remove permission from local state
        setPermissions(prevPermissions => 
          prevPermissions.filter(permission => permission.id !== selectedPermissionId)
        )
        
        toast({
          title: "Success",
          description: "Permission has been deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete permission",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the permission",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
      setDeleteDialogOpen(false)
      setSelectedPermissionId(null)
    }
  }, [selectedPermissionId])

  // Format permission name for display
  const getPermissionDisplayName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  const selectedPermission = selectedPermissionId ? 
    permissions.find(p => p.id === selectedPermissionId) : null

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Permissions ({filteredPermissions.length})</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system permissions and their assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshPermissions}
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
              <Link href="/admin/permissions/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Permission
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      {searchTerm ? (
                        <>
                          <p className="text-muted-foreground">No permissions match your search</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSearchTerm("")}
                          >
                            Clear Search
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground">No permissions found</p>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/admin/permissions/new">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create First Permission
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    {/* Permission Info */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {getPermissionDisplayName(permission.name)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {permission.name}
                        </div>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Roles Count */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {permission.roleCount > 0 ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{permission.roleCount}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">Assigned to roles:</p>
                                <ul className="text-xs space-y-0.5">
                                  {permission.roleNames.map((roleName) => (
                                    <li key={roleName}>• {roleName}</li>
                                  ))}
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">0</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Direct Users Count */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{permission.userCount}</span>
                      </div>
                    </TableCell>

                    {/* Total Assignments */}
                    <TableCell>
                      <Badge variant="outline">
                        {permission.totalAssignments}
                      </Badge>
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(permission.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Details */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/permissions/${permission.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Edit */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/permissions/${permission.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Permission</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Delete */}
                        {permission.canDelete ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => confirmDelete(permission.id)}
                                disabled={isDeleting === permission.id}
                              >
                                {isDeleting === permission.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Permission</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" disabled>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cannot delete: Permission is in use</p>
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
                This action cannot be undone. This will permanently delete the permission{" "}
                <strong>{selectedPermission?.name}</strong> from the system.
                {selectedPermission && selectedPermission.totalAssignments > 0 && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                    ⚠️ Warning: This permission has {selectedPermission.totalAssignments} assignment(s). 
                    Please remove all assignments first.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting || (selectedPermission && !selectedPermission.canDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permission"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}