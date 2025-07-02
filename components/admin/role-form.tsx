// components/admin/role-form.tsx - Updated for simplified schema
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { 
  createRoleWithPermissions,
  updateRolePermissions 
} from "@/lib/actions/role-permission-actions"
import { Shield, Users, Database, Settings, CheckCircle, ArrowLeft, Bug } from "lucide-react"
import Link from "next/link"

interface PermissionOption {
  value: string
  label: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description?: string | null
  permissions: string[]
  isSystem?: boolean
  isSystemRole?: boolean
  userCount?: number
  users?: Array<{ id: string; name: string; email: string }>
}

interface RoleFormProps {
  role?: Role
  availablePermissions: Record<string, PermissionOption[]>
  mode: "create" | "edit"
}

export function RoleForm({ role, availablePermissions, mode }: RoleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Filter out any invalid permissions from the role
  const initialPermissions = role?.permissions?.filter(p => p && typeof p === 'string') || []
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPermissions)
  const [formData, setFormData] = useState({
    name: role?.name || "",
    description: role?.description || ""
  })

  console.log("🚀 RoleForm initialized:", {
    mode,
    roleName: role?.name,
    initialPermissions: role?.permissions,
    cleanedPermissions: selectedPermissions,
    availablePermissionTables: Object.keys(availablePermissions),
    totalAvailablePermissions: Object.values(availablePermissions).reduce((total, perms) => total + perms.length, 0)
  })

  const isSystemRole = role?.isSystem || role?.isSystemRole || false

  // Clean permission selection function - prevent undefined values
  const togglePermission = (permissionValue: string) => {
    if (!permissionValue || typeof permissionValue !== 'string') {
      console.error("❌ Invalid permission value:", permissionValue)
      return
    }

    console.log("🔄 Toggling permission:", permissionValue)
    
    setSelectedPermissions(current => {
      // Filter out any undefined/invalid values first
      const cleanCurrent = current.filter(p => p && typeof p === 'string')
      const isSelected = cleanCurrent.includes(permissionValue)
      
      let newPermissions: string[]
      if (isSelected) {
        newPermissions = cleanCurrent.filter(p => p !== permissionValue)
        console.log("➖ Removed permission:", permissionValue)
      } else {
        newPermissions = [...cleanCurrent, permissionValue]
        console.log("➕ Added permission:", permissionValue)
      }
      
      console.log("✅ New permissions array:", newPermissions)
      return newPermissions
    })
  }

  // Table permissions toggle with proper validation
  const toggleTablePermissions = (tableName: string) => {
    const tablePermissions = availablePermissions[tableName] || []
    const tablePermissionValues = tablePermissions
      .map(p => p.value)
      .filter(v => v && typeof v === 'string')
    
    if (tablePermissionValues.length === 0) {
      console.warn("⚠️ No valid permissions for table:", tableName)
      return
    }

    console.log("🔄 Toggling table permissions:", { tableName, permissions: tablePermissionValues })
    
    setSelectedPermissions(current => {
      // Clean current permissions
      const cleanCurrent = current.filter(p => p && typeof p === 'string')
      
      // Check if all table permissions are currently selected
      const allSelected = tablePermissionValues.every(perm => cleanCurrent.includes(perm))
      
      let newPermissions: string[]
      if (allSelected) {
        // Remove all table permissions
        newPermissions = cleanCurrent.filter(p => !tablePermissionValues.includes(p))
        console.log("➖ Removed all permissions for:", tableName)
      } else {
        // Add all table permissions (remove existing ones first to avoid duplicates)
        const withoutTablePerms = cleanCurrent.filter(p => !tablePermissionValues.includes(p))
        newPermissions = [...withoutTablePerms, ...tablePermissionValues]
        console.log("➕ Added all permissions for:", tableName)
      }
      
      console.log("✅ New permissions after table toggle:", newPermissions)
      return newPermissions
    })
  }

  const isTableFullySelected = (tableName: string): boolean => {
    const tablePermissions = availablePermissions[tableName] || []
    const validTablePermissions = tablePermissions
      .map(p => p.value)
      .filter(v => v && typeof v === 'string')
    
    if (validTablePermissions.length === 0) return false
    
    const cleanSelected = selectedPermissions.filter(p => p && typeof p === 'string')
    return validTablePermissions.every(permission => cleanSelected.includes(permission))
  }

  const isTablePartiallySelected = (tableName: string): boolean => {
    const tablePermissions = availablePermissions[tableName] || []
    const validTablePermissions = tablePermissions
      .map(p => p.value)
      .filter(v => v && typeof v === 'string')
    
    const cleanSelected = selectedPermissions.filter(p => p && typeof p === 'string')
    const selectedCount = validTablePermissions.filter(permission => 
      cleanSelected.includes(permission)
    ).length
    
    return selectedCount > 0 && selectedCount < validTablePermissions.length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("📋 Form submission attempt:", {
      formData,
      selectedPermissions,
      cleanedPermissions: selectedPermissions.filter(p => p && typeof p === 'string'),
      validation: {
        hasName: !!formData.name?.trim(),
        nameValue: `"${formData.name}"`,
        nameLength: formData.name?.trim()?.length || 0,
        hasPermissions: selectedPermissions.filter(p => p && typeof p === 'string').length > 0,
        permissionCount: selectedPermissions.filter(p => p && typeof p === 'string').length
      }
    })
    
    // Clean and validate form data
    const trimmedName = formData.name?.trim() || ""
    const cleanPermissions = selectedPermissions.filter(p => p && typeof p === 'string')
    
    if (!trimmedName) {
      console.log("❌ Validation failed: Empty role name")
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      })
      return
    }

    if (cleanPermissions.length === 0) {
      console.log("❌ Validation failed: No valid permissions")
      toast({
        title: "Validation Error", 
        description: "At least one permission must be selected",
        variant: "destructive",
      })
      return
    }

    console.log("✅ Validation passed, submitting with clean data:", {
      name: trimmedName,
      description: formData.description?.trim() || "",
      permissions: cleanPermissions
    })
    
    setIsLoading(true)

    try {
      let result

      if (mode === "edit" && role) {
        console.log("📝 Updating role:", { roleId: role.id, permissions: cleanPermissions })
        result = await updateRolePermissions(role.id, cleanPermissions)
      } else {
        console.log("🆕 Creating role:", {
          name: trimmedName,
          description: formData.description?.trim() || "",
          permissions: cleanPermissions
        })
        result = await createRoleWithPermissions({
          name: trimmedName,
          description: formData.description?.trim() || "",
          permissions: cleanPermissions
        })
      }

      console.log("📤 Server response:", result)

      if (result && result.success) {
        console.log("🎉 Success!")
        toast({
          title: "Success",
          description: result.message || `Role ${mode === "edit" ? "updated" : "created"} successfully`,
        })
        router.push("/admin/roles")
        router.refresh()
      } else {
        console.error("❌ Server error:", result)
        toast({
          title: "Error",
          description: result?.error || `Failed to ${mode} role`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 Exception:", error)
      toast({
        title: "Error",
        description: `Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPermissionIcon = (tableName: string) => {
    switch (tableName.toLowerCase()) {
      case 'user':
      case 'users':
        return <Users className="h-4 w-4" />
      case 'role':
      case 'roles':
        return <Shield className="h-4 w-4" />
      case 'system':
        return <Settings className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  // Calculate clean counts for display
  const cleanSelectedCount = selectedPermissions.filter(p => p && typeof p === 'string').length
  const totalAvailableCount = Object.values(availablePermissions).reduce((total, perms) => total + perms.length, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/roles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? `Edit Role: ${role?.name}` : "Create New Role"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "edit" 
              ? "Update role permissions and settings" 
              : "Create a new role with specific permissions"
            }
          </p>
        </div>
      </div>

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Form State</h4>
                <ul className="space-y-1 text-xs">
                  <li>Mode: <code>{mode}</code></li>
                  <li>Name: <code>"{formData.name}"</code> (length: {formData.name?.length || 0})</li>
                  <li>Name Valid: <code>{!!formData.name?.trim() ? "true" : "false"}</code></li>
                  <li>Description: <code>"{formData.description}"</code></li>
                  <li>Loading: <code>{isLoading ? "true" : "false"}</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Permissions</h4>
                <ul className="space-y-1 text-xs">
                  <li>Selected (Clean): <code>{cleanSelectedCount}</code></li>
                  <li>Selected (Raw): <code>{selectedPermissions.length}</code></li>
                  <li>Available: <code>{totalAvailableCount}</code></li>
                  <li>Can Submit: <code>{!!formData.name?.trim() && cleanSelectedCount > 0 ? "true" : "false"}</code></li>
                </ul>
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-xs">Selected Permissions</summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto">
                {JSON.stringify(selectedPermissions, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {/* System Role Warning */}
      {isSystemRole && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This is a system role. Some settings may be restricted to prevent system instability.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {mode === "edit" ? "Edit Role" : "Create Role"}
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
                  onChange={(e) => {
                    const newValue = e.target.value
                    console.log("📝 Name input changed:", `"${newValue}"`)
                    setFormData(prev => ({ ...prev, name: newValue }))
                  }}
                  placeholder="e.g., Content Editor"
                  disabled={isSystemRole}
                  className={!formData.name?.trim() ? "border-red-300" : ""}
                />
                {!formData.name?.trim() && (
                  <p className="text-xs text-red-500">Role name is required</p>
                )}
                {isSystemRole && (
                  <p className="text-xs text-muted-foreground">System roles cannot be renamed</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                  }}
                  placeholder="Brief description of this role"
                />
              </div>
            </div>

            {/* Role Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {mode === "edit" && role && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {role.userCount || 0} users assigned
                </span>
              )}
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {cleanSelectedCount} permissions selected
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Select permissions for each table. Each permission grants specific access to database operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(availablePermissions).length > 0 ? (
              Object.entries(availablePermissions).map(([tableName, permissions]) => {
                const validPermissions = permissions.filter(p => p.value && typeof p.value === 'string')
                const isFullySelected = isTableFullySelected(tableName)
                const isPartiallySelected = isTablePartiallySelected(tableName)
                
                return (
                  <div key={tableName} className="space-y-3">
                    {/* Table Header with Select All */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPermissionIcon(tableName)}
                        <h4 className="font-medium capitalize">{tableName}</h4>
                        <Badge variant="outline">{validPermissions.length} permissions</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`select-all-${tableName}`}
                          checked={isFullySelected}
                          ref={(element) => {
                            if (element) {
                              element.indeterminate = isPartiallySelected
                            }
                          }}
                          onCheckedChange={() => {
                            console.log("🔄 Table select-all clicked:", tableName)
                            toggleTablePermissions(tableName)
                          }}
                        />
                        <Label 
                          htmlFor={`select-all-${tableName}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          Select All
                        </Label>
                      </div>
                    </div>

                    {/* Permission Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-6">
                      {validPermissions.map((permission) => {
                        const isChecked = selectedPermissions.includes(permission.value)
                        
                        return (
                          <div 
                            key={permission.value} 
                            className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={permission.value}
                              checked={isChecked}
                              onCheckedChange={() => {
                                console.log("☑️ Individual permission clicked:", permission.value)
                                togglePermission(permission.value)
                              }}
                            />
                            <div className="grid gap-1.5 leading-none flex-1">
                              <Label 
                                htmlFor={permission.value}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {permission.label}
                              </Label>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Separator */}
                    {tableName !== Object.keys(availablePermissions)[Object.keys(availablePermissions).length - 1] && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No permissions available</p>
                <p className="text-sm mt-2">Check your permission configuration.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/admin/roles")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {cleanSelectedCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {cleanSelectedCount} permission{cleanSelectedCount !== 1 ? 's' : ''} selected
              </span>
            )}
            <Button 
              type="submit" 
              disabled={isLoading || cleanSelectedCount === 0 || !formData.name?.trim()}
            >
              {isLoading ? "Saving..." : mode === "edit" ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}