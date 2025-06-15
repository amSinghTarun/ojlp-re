"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  // Check permissions
  const canManageUsers = hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)
  const canAssignRoles = hasPermission(currentUser, PERMISSIONS.ASSIGN_ROLES)
  const isCurrentUserSuperAdmin = isSuperAdmin(currentUser)

  const handleDeleteUser = async (id: string) => {
    setIsDeleting(id)
    try {
      const result = await deleteUser(id)
      if (result.success) {
        setUsers(users.filter((user) => user.id !== id))
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
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
      setIsDeleting(null)
    }
  }

  // Function to check if current user can edit a specific user
  const canEditUser = (user: User & { role: Role }) => {
    // Super admins can edit anyone
    if (isCurrentUserSuperAdmin) return true

    // Regular admins cannot edit super admins
    if (user.role.name === "Super Admin") return false

    // Regular admins can edit other users if they have permission
    return canManageUsers
  }

  // Function to check if current user can delete a specific user
  const canDeleteUser = (user: User & { role: Role }) => {
    // Users cannot delete themselves
    if (user.id === currentUser.id) return false

    // Super admins can delete anyone except themselves
    if (isCurrentUserSuperAdmin) return true

    // Regular admins cannot delete super admins
    if (user.role.name === "Super Admin") return false

    // Regular admins can delete other users if they have permission
    return canManageUsers
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Users</h2>
        {canManageUsers && (
          <Button asChild>
            <Link href="/admin/users/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      {user.role.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canEditUser(user) && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                      )}

                      {canDeleteUser(user) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the user. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={isDeleting === user.id}
                              >
                                {isDeleting === user.id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
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
    </div>
  )
}
