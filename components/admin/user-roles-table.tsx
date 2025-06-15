"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { updateUserRole } from "@/lib/actions/user-actions"
import { getRoles } from "@/lib/actions/role-actions"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS, canAssignRole } from "@/lib/permissions"
import type { User, Role } from "@prisma/client"

interface UserRolesTableProps {
  initialUsers: Array<User & { role: Role }>
}

export function UserRolesTable({ initialUsers }: UserRolesTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState<Array<User & { role: Role }>>(initialUsers)
  const [roles, setRoles] = useState<Array<Role & { canAssign: boolean }>>([])
  const [currentUser, setCurrentUser] = useState<(User & { role: Role }) | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch roles and current user on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get current user
        const user = await getCurrentUser()
        setCurrentUser(user)

        // Check if user has permission to assign roles
        if (!user || !(await hasPermission(user, PERMISSIONS.ASSIGN_ROLES))) {
          toast({
            title: "Permission Denied",
            description: "You don't have permission to assign roles",
            variant: "destructive",
          })
          return
        }

        // Get available roles
        const { roles: availableRoles } = await getRoles()
        if (availableRoles && user) {
          // Check which roles the current user can assign
          const rolesWithPermission = await Promise.all(
            availableRoles.map(async (role) => {
              const canAssign = await canAssignRole(user, role)
              return {
                ...role,
                canAssign,
              }
            }),
          )
          setRoles(rolesWithPermission)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRoleChange = async (userId: string, roleId: string) => {
    setUpdating(userId)
    try {
      // Check if current user can assign this role
      const roleToAssign = roles.find((r) => r.id === roleId)
      if (!roleToAssign || !roleToAssign.canAssign) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to assign this role",
          variant: "destructive",
        })
        return
      }

      const result = await updateUserRole(userId, roleId)
      if (result.success) {
        // Update the local state
        setUsers(
          users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  role: {
                    id: roleId,
                    name: roleToAssign.name,
                  },
                }
              : user,
          ),
        )

        toast({
          title: "Success",
          description: `User role updated successfully`,
        })

        // Refresh the page to reflect changes
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update user role",
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
      setUpdating(null)
    }
  }

  if (isLoading) {
    return <div>Loading users and roles...</div>
  }

  // Check if current user has permission to assign roles
  if (!currentUser || !hasPermission(currentUser, PERMISSIONS.ASSIGN_ROLES)) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive">You don't have permission to assign roles</div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                  {user.role.name}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={user.role.id}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                    disabled={updating === user.id || user.id === currentUser.id}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id} disabled={!role.canAssign}>
                          {role.name}
                          {!role.canAssign && " (No permission)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {updating === user.id && (
                    <Button variant="ghost" size="sm" disabled>
                      Updating...
                    </Button>
                  )}

                  {user.id === currentUser.id && (
                    <span className="text-xs text-muted-foreground ml-2">(Cannot change your own role)</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
