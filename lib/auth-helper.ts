import { getServerSession } from "next-auth/next";
import { authOptions } from "@@/auth";

/**
 * Helper function to get session in server components
 * Use this in Server Components and API routes
 */
export async function auth() {
    return await getServerSession(authOptions);
}
