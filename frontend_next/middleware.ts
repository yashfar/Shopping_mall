import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect authenticated users away from login/register
    if ((path === "/login" || path === "/register") && token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Admin routes require ADMIN role
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return new NextResponse("Access denied", { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Login and register are publicly accessible (redirect handled in proxy)
        if (path === "/login" || path === "/register") return true;
        // All other matched routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/login", "/register", "/dashboard/:path*", "/admin/:path*"],
};
