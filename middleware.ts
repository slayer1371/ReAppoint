import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const pathname = request.nextUrl.pathname

  // Check if user is authenticated
  const isAuthenticated = !!token

  // If authenticated user tries to access auth routes, redirect to dashboard
  if (isAuthenticated && (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/(auth)"))) {
    const role = (token as any)?.role
    const dashboardUrl = role === "business" ? "/business/dashboard" : "/appointments"
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // If authenticated user goes to home page, redirect to appropriate dashboard
  if (isAuthenticated && pathname === "/") {
    const role = (token as any)?.role
    const dashboardUrl = role === "business" ? "/business/dashboard" : "/appointments"
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // If unauthenticated user tries to access protected routes, redirect to login
  const protectedRoutes = ["/dashboard", "/appointments", "/settings", "/profile", "/services", "/waitlist"]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
