import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for route protection.
 * Protects admin routes by checking for valid session cookie.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/interview',
    '/api/interview',
    '/api/auth',
  ]

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions (favicon.ico, etc.)
  ) {
    return NextResponse.next()
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/project',
    '/api/projects',
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // If it's a protected route, check for authentication
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('admin_session')

    if (!sessionCookie || !sessionCookie.value) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Niet geautoriseerd' },
          { status: 401 }
        )
      }

      // For page routes, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Session cookie exists - allow the request
    // Note: Full session validation happens in the API routes
    return NextResponse.next()
  }

  // For the root path, check authentication
  if (pathname === '/') {
    const sessionCookie = request.cookies.get('admin_session')

    if (!sessionCookie || !sessionCookie.value) {
      // Not authenticated, redirect to login
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated, redirect to dashboard
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Allow all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
