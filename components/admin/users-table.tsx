"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"
import { deleteUser } from "@/lib/actions/user-actions"
import { hasPermission, PERMISSIONS, isSuperAdmin } from "@/lib/permissions"
import type { User, Role } from "@prisma/client"

interface UsersTableProps {
  currentUser: User & { role: Role }
  initialUsers: Array<User & { role: Role }>
}

export function UsersTable({ currentUser, initialUsers }: UsersTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check permissions
  const canManageUsers = hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)
  const canAssignRoles = hasPermission(currentUser, PERMISSIONS.ASSIGN_ROLES)
  const isCurrentUserSuperAdmin = isSuperAdmin(currentUser)

  // Refresh users list
  const refreshUsers = useCallback(async () => {
    setIsRefreshing(true)
    try {
      router.refresh()
      toast({
        title: "Refreshed",
        description: "Users list has been refreshed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh users list",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [router])

  // Handle delete user
  const handleDeleteUser = useCallback(async (id: string) => {
    setIsDeleting(id)
    try {
      const result = await deleteUser(id)
      if (result.success) {
        // Remove user from local state
        setUsers(prevUsers => prevUsers.filter((user) => user.id !== id))
        
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        
        // Close dialog and reset state
        setDeleteDialogOpen(false)
        setSelectedUserId(null)
        
        // Refresh the page to ensure consistency
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }, [router])

  // Open delete confirmation dialog
  const confirmDelete = useCallback((userId: string) => {
    setSelectedUserId(userId)
    setDeleteDialogOpen(true)
  }, [])

  // Execute delete action
  const executeDelete = useCallback(async () => {
    if (selectedUserId) {
      await handleDeleteUser(selectedUserId)
    }
  }, [selectedUserId, handleDeleteUser])

  // Function to check if current user can edit a specific user
  const canEditUser = useCallback((user: User & { role: Role }) => {
    // Users cannot edit themselves through this interface
    if (user.id === currentUser.id) return false
    
    // Super admins can edit anyone except themselves
    if (isCurrentUserSuperAdmin) return true

    // Regular admins cannot edit super admins
    if (user.role.name === "Super Admin") return false

    // Regular admins can edit other users if they have permission
    return canManageUsers
  }, [isCurrentUserSuperAdmin, canManageUsers, currentUser.id])

  // Function to check if current user can delete a specific user
  const canDeleteUser = useCallback((user: User & { role: Role }) => {
    // Users cannot delete themselves
    if (user.id === currentUser.id) return false

    // Super admins can delete anyone except themselves
    if (isCurrentUserSuperAdmin) return true

    // Regular admins cannot delete super admins
    if (user.role.name === "Super Admin") return false

    // Regular admins can delete other users if they have permission
    return canManageUsers
  }, [isCurrentUserSuperAdmin, canManageUsers, currentUser.id])

  // Get role badge variant based on role name
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

  // Format user creation date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Users ({users.length})</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system users and their roles
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshUsers}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          {canManageUsers && (
            <Button asChild>
              <Link href="/admin/users/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">No users found</p>
                    {canManageUsers && (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/users/new">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add First User
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  {/* User Info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.id === currentUser.id && (
                          <Badge variant="outline" className="text-xs mt-1">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role.name)}>
                      {user.role.name}
                    </Badge>
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                      Active
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canEditUser(user) && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit {user.name}</span>
                          </Link>
                        </Button>
                      )}

                      {canDeleteUser(user) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmDelete(user.id)}
                          disabled={isDeleting === user.id}
                        >
                          {isDeleting === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete {user.name}</span>
                        </Button>
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
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
              {selectedUser?.role.name === "Super Admin" && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                  ⚠️ You are about to delete a Super Admin user. This is a critical action.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setSelectedUserId(null)
                setDeleteDialogOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              disabled={isDeleting !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}