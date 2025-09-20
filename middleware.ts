import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSetupPage = pathname === "/setup";

  // Allow API routes needed for setup and static files to pass through
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  try {
    // Check the setup status from our API endpoint
    const statusResponse = await fetch(new URL('/api/setup/status', request.url));
    if (!statusResponse.ok) {
        throw new Error("Setup status check failed");
    }
    const setupStatus = await statusResponse.json();

    // If setup is NOT complete AND we are NOT on the setup page, redirect to /setup
    if (!setupStatus.isInitialized && !isSetupPage) {
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    // If setup IS complete AND we are on the setup page, redirect to the dashboard
    if (setupStatus.isInitialized && isSetupPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }

  } catch (error) {
    console.error("Middleware error:", error);
    // If the status check fails, it's safer to redirect to setup
    if (!isSetupPage) {
        return NextResponse.redirect(new URL('/setup', request.url));
    }
  }

  return NextResponse.next();
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
};
