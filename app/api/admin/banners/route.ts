import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// GET /api/admin/banners - List all banners
export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const banners = await prisma.banner.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json(banners);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
    }
}

// POST /api/admin/banners - Create new banner
export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { imageUrl, title, subtitle, active, order } = body;

        const banner = await prisma.banner.create({
            data: {
                imageUrl,
                title,
                subtitle,
                active,
                order: order || 0,
            },
        });
        return NextResponse.json(banner, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
    }
}
