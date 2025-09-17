import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow setup routes and API routes
  if (pathname.startsWith("/api/setup") || pathname === "/setup") {
    return NextResponse.next()
  }

  // Check if setup is completed by looking for setup status
  // This is a simple check - in production you might want to cache this
  if (pathname !== "/setup" && !pathname.startsWith("/api/")) {
    // Redirect to setup if not completed
    // This will be handled by the setup page component
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
