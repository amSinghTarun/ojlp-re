import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermissionForRoute } from './permission-checker'

export async function dynamicRouteMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip non-admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Skip auth-related routes
  if (pathname.includes('/auth/') || pathname === '/admin/access-denied') {
    return NextResponse.next()
  }

  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Check route permission dynamically
    const hasAccess = await hasPermissionForRoute(user, pathname)
    
    if (!hasAccess) {
      const redirectUrl = new URL('/admin/access-denied', request.url)
      redirectUrl.searchParams.set('route', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Route middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}
