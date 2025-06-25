// components/admin/users-table.tsx
"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Pencil, Trash2, Loader2, RefreshCw, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  // Check permissions
  const canManageUsers = true //hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)
  const canAssignRoles = true //hasPermission(currentUser, PERMISSIONS.ASSIGN_ROLES)
  const isCurrentUserSuperAdmin = true //isSuperAdmin(currentUser)

  // Get unique roles for filter
  const availableRoles = Array.from(new Set(users.map(user => user.role.name)))

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === "all" || user.role.name === roleFilter

    return matchesSearch && matchesRole
  })

  // Refresh users list
  const refreshUsers = useCallback(async () => {
    setIsRefreshing(true)
    try {
      router.refresh()
      // Optionally fetch updated data here if you want real-time updates
      toast({
        title: "Refreshed",
        description: "User list has been updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh user list",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [router])

  // Confirm delete action
  const confirmDelete = useCallback((userId: string) => {
    setSelectedUserId(userId)
    setDeleteDialogOpen(true)
  }, [])

  // Handle delete action
  const handleDelete = useCallback(async () => {
    if (!selectedUserId) return

    setIsDeleting(selectedUserId)
    
    try {
      const result = await deleteUser(selectedUserId)
      
      if (result.success) {
        // Remove user from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUserId))
        
        toast({
          title: "Success",
          description: "User has been deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the user",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
      setDeleteDialogOpen(false)
      setSelectedUserId(null)
    }
  }, [selectedUserId])

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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Users ({filteredUsers.length})</h2>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    {searchTerm || roleFilter !== "all" ? (
                      <>
                        <p className="text-muted-foreground">No users match your search criteria</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSearchTerm("")
                            setRoleFilter("all")
                          }}
                        >
                          Clear Filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">No users found</p>
                        {canManageUsers && (
                          <Button asChild variant="outline" size="sm">
                            <Link href="/admin/users/new">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Add First User
                            </Link>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  {/* User Info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {user.image ? (
                          <img 
                            src={user.image} 
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
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
                  <TableCell className="text-muted-foreground text-sm">
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
                        <AlertDialog open={deleteDialogOpen && selectedUserId === user.id} onOpenChange={setDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
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
                          </AlertDialogTrigger>
                        </AlertDialog>
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
              This action cannot be undone. This will permanently delete the user account for{" "}
              <strong>{selectedUser?.name}</strong> and remove all associated data.
              {selectedUser?.role.name === "Super Admin" && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  ⚠️ Warning: You are about to delete a Super Admin account. Make sure there are other Super Admin accounts available.
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
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}