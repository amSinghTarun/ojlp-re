"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { getUser, updateUserPermissions } from "@/lib/actions/user-actions"
import { getAllRoutePermissions, getAllPermissions } from "@/lib/permissions"
import type { User } from "@/lib/types"

interface PermissionsManagerProps {
  initialUsers: User[]
}

export function PermissionsManager({ initialUsers }: PermissionsManagerProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers.filter((user) => user.role !== "SUPER_ADMIN"))
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [routePermissions, setRoutePermissions] = useState<
    Array<{ route: string; permission: string; description: string }>
  >([])
  const [allPermissions, setAllPermissions] = useState<Array<{ id: string; name: string }>>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Get all route permissions and all permissions on component mount
  useEffect(() => {
    const routes = getAllRoutePermissions()
    setRoutePermissions(routes)

    const permissions = getAllPermissions()
    setAllPermissions(permissions)
  }, [])

  // Fetch user details when a user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUser(null)
      setSelectedPermissions([])
      return
    }

    const fetchUserDetails = async () => {
      try {
        const { user, error } = await getUser(selectedUserId)
        if (user) {
          setSelectedUser(user)
          setSelectedPermissions(user.permissions || [])
        } else if (error) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch user details",
          variant: "destructive",
        })
      }
    }

    fetchUserDetails()
  }, [selectedUserId])

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permission])
    } else {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permission))
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const result = await updateUserPermissions(selectedUser.id, selectedPermissions)
      if (result.success) {
        toast({
          title: "Success",
          description: `Permissions updated for ${selectedUser.name}`,
        })

        // Update the local state
        setUsers(
          users.map((user) => (user.id === selectedUser.id ? { ...user, permissions: selectedPermissions } : user)),
        )

        // Refresh the page to reflect changes
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update permissions",
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
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
          <CardDescription>Select a user to manage their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-4 md:col-span-1">
              <h4 className="text-sm font-medium">Users</h4>
              <div className="space-y-2">
                {users.map((user) => (
                  <Button
                    key={user.id}
                    variant={selectedUserId === user.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    {user.name}
                    <span className="ml-2 text-xs opacity-70">({user.role})</span>
                  </Button>
                ))}
              </div>
            </div>

            {selectedUser ? (
              <div className="space-y-6 md:col-span-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Managing permissions for {selectedUser.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Current role: <span className="font-medium">{selectedUser.role}</span>
                  </p>
                </div>

                <Tabs defaultValue="routes">
                  <TabsList>
                    <TabsTrigger value="routes">Route Permissions</TabsTrigger>
                    <TabsTrigger value="all">All Permissions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="routes" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select which routes this user can access. These override the default role-based permissions.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {routePermissions.map((route) => (
                        <div key={route.route} className="flex items-start space-x-2">
                          <Checkbox
                            id={`route-${route.permission}`}
                            checked={selectedPermissions.includes(route.permission)}
                            onCheckedChange={(checked) => handlePermissionChange(route.permission, checked === true)}
                          />
                          <div className="grid gap-1.5">
                            <label
                              htmlFor={`route-${route.permission}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {route.route}
                            </label>
                            <p className="text-sm text-muted-foreground">{route.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="all" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select individual permissions for this user. These override the default role-based permissions.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => handlePermissionChange(permission.id, checked === true)}
                          />
                          <label
                            htmlFor={`perm-${permission.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end">
                  <Button onClick={handleSavePermissions} disabled={saving}>
                    {saving ? "Saving..." : "Save Permissions"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="md:col-span-3 flex items-center justify-center p-6 border rounded-md">
                <p className="text-muted-foreground">Select a user to manage their permissions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
