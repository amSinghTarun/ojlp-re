import { getCurrentUser } from '@/lib/auth'
import { checkCrudPermission } from './permission-checker'
import { CRUD_OPERATIONS } from './route-discovery'

// Extend Prisma with permission checks
export function createPermissionMiddleware() {
  return async (params: any, next: any) => {
    const { model, action } = params

    // Skip permission checks for certain models or actions
    if (!model || ['User', 'Role', 'Permission'].includes(model)) {
      return next(params)
    }

    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      // Map Prisma actions to CRUD operations
      const operation = mapPrismaActionToCrud(action)
      const resource = model.toLowerCase()

      if (!checkCrudPermission(user, resource, operation)) {
        throw new Error(`Permission denied: ${operation} ${resource}`)
      }

      return next(params)
    } catch (error) {
      throw error
    }
  }
}

function mapPrismaActionToCrud(action: string): string {
  switch (action) {
    case 'findMany':
    case 'findFirst':
    case 'findUnique':
    case 'count':
      return CRUD_OPERATIONS.VIEW
    case 'create':
    case 'createMany':
      return CRUD_OPERATIONS.CREATE
    case 'update':
    case 'updateMany':
    case 'upsert':
      return CRUD_OPERATIONS.EDIT
    case 'delete':
    case 'deleteMany':
      return CRUD_OPERATIONS.DELETE
    default:
      return CRUD_OPERATIONS.VIEW
  }
}
