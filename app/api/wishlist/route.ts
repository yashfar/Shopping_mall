import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// GET /api/wishlist - get user's wishlist
export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const items = await prisma.wishlist.findMany({
            where: { userId: session.user.id },
            include: {
                product: {
                    include: {
                        reviews: { select: { rating: true } },
                        category: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(items);
    } catch {
        return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
    }
}
