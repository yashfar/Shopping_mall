import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users
 * Returns paginated users with optional search (admin only)
 * Query params: search, page, limit
 */
export async function GET(request: Request) {
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
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
        const skip = (page - 1) * limit;

        const where = search
            ? { email: { contains: search, mode: "insensitive" as const } }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
