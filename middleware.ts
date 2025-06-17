import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { ROUTE_PERMISSIONS } from "./lib/permissions"

export async function middleware(request: NextRequest) {
  console.log(request.url)
  if(request.url.includes("/admin/login")) {
    console.log("login page")
    return NextResponse.next()
  }

  const token = await getToken({ req: request })
  console.log(token)
  // If the user is not logged in, redirect to the login page
  if (!token) {
    const url = new URL("/admin/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Super Admin bypasses all permission checks
  if (token.role === "Super Admin") {
    return NextResponse.next()
  }

  // Check if the route requires specific permissions
  const path = request.nextUrl.pathname

  // Check admin routes that require permissions
  if (path.startsWith("/admin") && path !== "/admin/login") {
    // Find the most specific route permission that applies
    const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
      .filter((route) => path.startsWith(route))
      .sort((a, b) => b.length - a.length) // Sort by specificity (longest route first)

    if (matchingRoutes.length > 0) {
      const requiredPermission = ROUTE_PERMISSIONS[matchingRoutes[0]]

      // Check if the user has the required permission
      const userPermissions = token.permissions || []
      const rolePermissions = token.rolePermissions || []
      const hasPermission = [...userPermissions, ...rolePermissions].includes(requiredPermission)

      if (!hasPermission) {
        // Redirect to dashboard with access denied message
        const url = new URL("/admin", request.url)
        url.searchParams.set("accessDenied", "true")
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
