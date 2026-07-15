import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";

/**
 * Example Admin API Route
 * Only accessible to users with ADMIN role
 */
export async function GET() {
    const session = await auth();

    // Check if user is authenticated
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user has ADMIN role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Admin-only logic here
    return NextResponse.json({
        message: "Admin access granted",
        admin: {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
        },
    });
}
