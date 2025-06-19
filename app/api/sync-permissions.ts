import { syncRoutePermissions } from '@/lib/permissions/auto-sync'

export async function POST() {
  try {
    const result = await syncRoutePermissions()
    return Response.json(result)
  } catch (error) {
    return Response.json(
      { success: false, error: error.message }, 
      { status: 500 }
    )
  }
}
