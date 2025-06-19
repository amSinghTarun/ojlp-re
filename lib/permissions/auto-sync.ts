import { generatePermissionsFromRoutes } from './route-discovery'
import { createPermission } from '@/lib/controllers/permissions'

// Auto-sync permissions based on discovered routes
export async function syncRoutePermissions() {
  try {
    const discoveredPermissions = generatePermissionsFromRoutes()
    
    for (const permission of discoveredPermissions) {
      try {
        await createPermission({
          name: permission.name,
          description: permission.description
        })
        console.log(`Created permission: ${permission.name}`)
      } catch (error) {
        // Permission might already exist, skip
        if (!error.message.includes('already exists')) {
          console.error(`Error creating permission ${permission.name}:`, error)
        }
      }
    }

    console.log(`Synced ${discoveredPermissions.length} permissions`)
    return { success: true, synced: discoveredPermissions.length }
  } catch (error) {
    console.error('Error syncing route permissions:', error)
    return { success: false, error: error.message }
  }
}
