import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users
 * Returns all users (admin only)
 */
export async function GET() {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
