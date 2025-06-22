// components/admin/role-permissions-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { 
  getAvailablePermissions,
  createRoleWithPermissions,
  updateRolePermissions 
} from "@/lib/actions/role-permission-actions"
import { Shield, Users, Database, Settings, CheckCircle } from "lucide-react"

interface PermissionOption {
  value: string
  label: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
  isSystem: boolean
}

interface RolePermissionsFormProps {
  role?: Role
  onSuccess?: () => void
  onCancel?: () => void
}

export function RolePermissionsForm({ role, onSuccess, onCancel }: RolePermissionsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, PermissionOption[]>>({})
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role?.permissions || [])
  const [formData, setFormData] = useState({
    name: role?.name || "",
    description: role?.description || ""
  })

  // Load available permissions
  useEffect(() => {
    async function loadPermissions() {
      try {
        const result = await getAvailablePermissions()
        if (result.success) {
          setAvailablePermissions(result.data.grouped)
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to load permissions:", error)
        toast({
          title: "Error",
          description: "Failed to load available permissions",
          variant: "destructive",
        })
      }
    }
    loadPermissions()
  }, [])

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permission])
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permission))
    }
  }

  const handleTableAllToggle = (tableName: string, checked: boolean) => {
    const tablePermissions = availablePermissions[tableName] || []
    
    if (checked) {
      // Add all permissions for this table
      const newPermissions = tablePermissions.map(p => p.value)
      setSelectedPermissions(prev => {
        const filtered = prev.filter(p => !tablePermissions.some(tp => tp.value === p))
        return [...filtered, ...newPermissions]
      })
    } else {
      // Remove all permissions for this table
      setSelectedPermissions(prev => 
        prev.filter(p => !tablePermissions.some(tp => tp.value === p))
      )
    }
  }

  const isTableFullySelected = (tableName: string): boolean => {
    const tablePermissions = availablePermissions[tableName] || []
    return tablePermissions.every(permission => 
      selectedPermissions.includes(permission.value)
    )
  }

  const isTablePartiallySelected = (tableName: string): boolean => {
    const tablePermissions = availablePermissions[tableName] || []
    return tablePermissions.some(permission => 
      selectedPermissions.includes(permission.value)
    ) && !isTableFullySelected(tableName)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      })
      return
    }

    if (selectedPermissions.length === 0) {
      toast({
        title: "Validation Error", 
        description: "At least one permission must be selected",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      let result
      
      if (role) {
        // Update existing role
        result = await updateRolePermissions(role.id, selectedPermissions)
      } else {
        // Create new role
        result = await createRoleWithPermissions({
          name: formData.name,
          description: formData.description,
          permissions: selectedPermissions
        })
      }

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Role saved successfully",
        })
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save role:", error)
      toast({
        title: "Error",
        description: "Failed to save role",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case 'System': return <Settings className="h-4 w-4" />
      case 'User': return <Users className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const getPermissionColor = (permissionValue: string) => {
    if (permissionValue.includes('.ALL')) return 'bg-purple-100 text-purple-800 border-purple-200'
    if (permissionValue.includes('.CREATE')) return 'bg-green-100 text-green-800 border-green-200'
    if (permissionValue.includes('.READ')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (permissionValue.includes('.UPDATE')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (permissionValue.includes('.DELETE')) return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {role ? "Edit Role" : "Create Role"}
          </CardTitle>
          <CardDescription>
            Define role details and permissions for database operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Content Editor"
                disabled={role?.isSystem}
              />
              {role?.isSystem && (
                <p className="text-xs text-muted-foreground">System roles cannot be renamed</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this role"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Select permissions for each table. Permissions follow the format: table_name.OPERATION
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Selected Permissions Summary */}
          {selectedPermissions.length > 0 && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span><strong>{selectedPermissions.length}</strong> permissions selected</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPermissions([])}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedPermissions.map(permission => (
                    <Badge 
                      key={permission} 
                      variant="outline" 
                      className={`text-xs ${getPermissionColor(permission)}`}
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {Object.entries(availablePermissions).map(([category, permissions]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  {getPermissionIcon(category)}
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <Badge variant="secondary">{permissions.length} permissions</Badge>
                  
                  {/* Select All for Category */}
                  <div className="ml-auto flex items-center space-x-2">
                    <Checkbox
                      id={`all-${category}`}
                      checked={isTableFullySelected(category)}
                      ref={(el) => {
                        if (el) el.indeterminate = isTablePartiallySelected(category)
                      }}
                      onCheckedChange={(checked) => handleTableAllToggle(category, checked as boolean)}
                    />
                    <Label htmlFor={`all-${category}`} className="text-sm">
                      Select All {category}
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                  {permissions.map((permission) => (
                    <div
                      key={permission.value}
                      className={`border rounded-lg p-3 transition-colors ${
                        selectedPermissions.includes(permission.value)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={permission.value}
                          checked={selectedPermissions.includes(permission.value)}
                          onCheckedChange={(checked) => 
                            handlePermissionToggle(permission.value, checked as boolean)
                          }
                        />
                        <div className="space-y-1 flex-1">
                          <Label 
                            htmlFor={permission.value} 
                            className="text-sm font-medium cursor-pointer"
                          >
                            {permission.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPermissionColor(permission.value)}`}
                          >
                            {permission.value}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {category !== 'System' && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : role ? "Update Role" : "Create Role"}
        </Button>
      </div>
    </form>
  )
}