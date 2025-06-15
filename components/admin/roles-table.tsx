"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Pencil, Trash2, Shield } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { deleteRole } from "@/lib/actions/role-actions"

interface Role {
  id: string
  name: string
  description: string
  isSystem: boolean
  userCount: number
  permissionNames: string[]
}

interface RolesTableProps {
  initialRoles: Role[]
}

export function RolesTable({ initialRoles }: RolesTableProps) {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDeleteRole = async (id: string) => {
    setIsDeleting(id)
    try {
      const result = await deleteRole(id)
      if (result.success) {
        setRoles(roles.filter((role) => role.id !== id))
        toast({
          title: "Success",
          description: "Role deleted successfully",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete role",
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Roles</h2>
        <Button asChild>
          <Link href="/admin/roles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Role
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {role.name}
                      {role.isSystem && (
                        <Badge variant="secondary" className="ml-2">
                          <Shield className="h-3 w-3 mr-1" />
                          System
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.userCount}</TableCell>
                  <TableCell>
                    {role.name === "Super Admin" ? (
                      <Badge variant="default" className="bg-primary">
                        All Permissions
                      </Badge>
                    ) : (
                      <span>{role.permissionNames.length}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/roles/${role.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>

                      {!role.isSystem && role.userCount === 0 && (
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
                                This will permanently delete the role. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRole(role.id)}
                                disabled={isDeleting === role.id}
                              >
                                {isDeleting === role.id ? "Deleting..." : "Delete"}
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
