import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware configuration for NextAuth v4 with Role-Based Access Control
 * 
 * - /dashboard routes: require any authenticated user
 * - /admin routes: require authenticated user with role === "ADMIN"
 */
export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check if accessing admin routes
    if (path.startsWith("/admin")) {
      // Require ADMIN role
      if (token?.role !== "ADMIN") {
        return new NextResponse("Access denied", { status: 403 });
      }
    }

    // All other protected routes just need authentication (handled by withAuth)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
