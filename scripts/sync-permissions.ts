const { syncRoutePermissions } = require('../lib/permissions/auto-sync')

async function main() {
  console.log('Discovering and syncing route permissions...')
  const result = await syncRoutePermissions()
  
  if (result.success) {
    console.log(`✅ Successfully synced ${result.synced} permissions`)
  } else {
    console.error(`❌ Error syncing permissions: ${result.error}`)
    process.exit(1)
  }
}
