// lib/permissions/schema-reader.ts
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface TableInfo {
  name: string
  modelName: string
  displayName: string
  description?: string
}

export interface PermissionOption {
  value: string
  label: string
  description: string
}

// CRUD operations
export const CRUD_OPERATIONS = {
  CREATE: 'CREATE',
  READ: 'READ', 
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ALL: 'ALL'
} as const

export type CrudOperation = keyof typeof CRUD_OPERATIONS

// Read Prisma schema file and extract model names
export function extractModelsFromSchema(): TableInfo[] {
  try {
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')
    const schemaContent = readFileSync(schemaPath, 'utf-8')
    
    // Regex to match model declarations
    const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g
    const models: TableInfo[] = []
    
    let match
    while ((match = modelRegex.exec(schemaContent)) !== null) {
      const modelName = match[1]
      const modelContent = match[2]
      
      // Extract comment if exists (for display name/description)
      const commentMatch = modelContent.match(/\/\/\s*(.+)/)
      const description = commentMatch ? commentMatch[1].trim() : undefined
      
      models.push({
        name: modelName.toLowerCase(),
        modelName: modelName,
        displayName: formatDisplayName(modelName),
        description
      })
    }
    
    return models.filter(model => !isSystemModel(model.modelName))
  } catch (error) {
    console.error('Error reading Prisma schema:', error)
    return []
  }
}

// Alternative: Get models from Prisma Client (runtime approach)
export function extractModelsFromPrismaClient(): TableInfo[] {
  const prisma = new PrismaClient()
  
  // Get all model names from Prisma client
  const modelNames = Object.keys(prisma).filter(key => 
    !key.startsWith('$') && 
    !key.startsWith('_') &&
    typeof (prisma as any)[key] === 'object' &&
    (prisma as any)[key].findMany
  )
  
  return modelNames
    .filter(name => !isSystemModel(name))
    .map(name => ({
      name: name.toLowerCase(),
      modelName: name,
      displayName: formatDisplayName(name),
    }))
}

// Generate all possible permissions for a table
export function generateTablePermissions(tableName: string): PermissionOption[] {
  const tableDisplay = formatDisplayName(tableName)
  
  return [
    {
      value: `${tableName}.ALL`,
      label: `${tableDisplay} - All Operations`,
      description: `Full access to ${tableDisplay} (Create, Read, Update, Delete)`
    },
    {
      value: `${tableName}.CREATE`,
      label: `${tableDisplay} - Create`,
      description: `Create new ${tableDisplay.toLowerCase()} records`
    },
    {
      value: `${tableName}.READ`,
      label: `${tableDisplay} - Read`,
      description: `View ${tableDisplay.toLowerCase()} records`
    },
    {
      value: `${tableName}.UPDATE`,
      label: `${tableDisplay} - Update`,
      description: `Edit existing ${tableDisplay.toLowerCase()} records`
    },
    {
      value: `${tableName}.DELETE`,
      label: `${tableDisplay} - Delete`,
      description: `Delete ${tableDisplay.toLowerCase()} records`
    }
  ]
}

// Generate all permissions for all tables
export function generateAllPermissions(): PermissionOption[] {
  const models = extractModelsFromSchema()
  const allPermissions: PermissionOption[] = []
  
  // Add system-level permissions first
  allPermissions.push(
    {
      value: 'SYSTEM.ADMIN',
      label: 'System Administrator',
      description: 'Full system access (bypasses all other permissions)'
    },
    {
      value: 'SYSTEM.USER_MANAGEMENT',
      label: 'User Management',
      description: 'Manage users and their permissions'
    },
    {
      value: 'SYSTEM.ROLE_MANAGEMENT',
      label: 'Role Management',
      description: 'Create and manage roles and permissions'
    }
  )
  
  // Add table-specific permissions
  models.forEach(model => {
    allPermissions.push(...generateTablePermissions(model.name))
  })
  
  return allPermissions
}

// Group permissions by table for UI display
export function groupPermissionsByTable(): Record<string, PermissionOption[]> {
  const allPermissions = generateAllPermissions()
  const grouped: Record<string, PermissionOption[]> = {
    'System': []
  }
  
  allPermissions.forEach(permission => {
    if (permission.value.startsWith('SYSTEM.')) {
      grouped['System'].push(permission)
    } else {
      const tableName = permission.value.split('.')[0]
      const displayName = formatDisplayName(tableName)
      
      if (!grouped[displayName]) {
        grouped[displayName] = []
      }
      grouped[displayName].push(permission)
    }
  })
  
  return grouped
}

// Helper functions
function formatDisplayName(name: string): string {
  // Convert camelCase/PascalCase to Title Case
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function isSystemModel(modelName: string): boolean {
  // Skip internal/system models
  const systemModels = [
    'Session',
    'VerificationToken', 
    'Account',
    '_prisma_migrations'
  ]
  return systemModels.includes(modelName)
}

// Get table name from route
export function getTableNameFromRoute(routePath: string): string | null {
  // Extract table name from route like "/admin/users" -> "user"
  // or "/admin/journal-articles" -> "journalarticle" 
  const match = routePath.match(/\/admin\/([^\/]+)/)
  if (!match) return null
  
  let tableName = match[1]
  
  // Handle kebab-case to model name conversion
  const routeToModelMap: Record<string, string> = {
    'journal-articles': 'article',
    'call-for-papers': 'callforpapers',
    'journal-issues': 'journalissue',
    'role-permissions': 'rolepermission',
    // Add more mappings as needed
  }
  
  return routeToModelMap[tableName] || tableName.replace(/-/g, '').replace(/s$/, '')
}

export default {
  extractModelsFromSchema,
  extractModelsFromPrismaClient,
  generateTablePermissions,
  generateAllPermissions,
  groupPermissionsByTable,
  getTableNameFromRoute,
  CRUD_OPERATIONS
}