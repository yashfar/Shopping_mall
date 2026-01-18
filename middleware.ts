export { default } from "next-auth/middleware";

/**
 * Middleware configuration for NextAuth v4
 * Protects routes that require authentication
 */
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
