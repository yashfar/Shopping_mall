import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";

/**
 * Helper function to protect admin API routes
 * Returns session if user is authenticated and has ADMIN role
 * Otherwise returns a 403 response
 */
export async function requireAdmin() {
    const session = await auth();

    if (!session) {
        return {
            session: null,
            response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }

    if (session.user.role !== "ADMIN") {
        return {
            session: null,
            response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }

    return { session, response: null };
}

/**
 * Helper function to protect any authenticated API routes
 * Returns session if user is authenticated
 * Otherwise returns a 401 response
 */
export async function requireAuth() {
    const session = await auth();

    if (!session) {
        return {
            session: null,
            response: NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            ),
        };
    }

    return { session, response: null };
}
