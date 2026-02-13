import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(request) {
    // Protected routes - redirect to login if not authenticated
    const isAuthenticated = !!request.nextauth.token
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                       request.nextUrl.pathname.startsWith('/signup')
    const isPublicPage = request.nextUrl.pathname === '/' ||
                         request.nextUrl.pathname.startsWith('/api/auth')

    if (!isAuthenticated && !isAuthPage && !isPublicPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthPage) {
      return NextResponse.redirect(new URL('/chat', request.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true // Always run middleware, we handle auth logic above
    }
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest|json)$).*)',
  ],
}
