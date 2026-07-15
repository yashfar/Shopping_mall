import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// POST /api/wishlist/toggle  { productId }
// Adds if not in wishlist, removes if already there
export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: "productId is required" }, { status: 400 });
        }

        const existing = await prisma.wishlist.findUnique({
            where: { userId_productId: { userId: session.user.id, productId } },
        });

        if (existing) {
            await prisma.wishlist.delete({ where: { id: existing.id } });
            return NextResponse.json({ wishlisted: false });
        } else {
            await prisma.wishlist.create({
                data: { userId: session.user.id, productId },
            });
            return NextResponse.json({ wishlisted: true });
        }
    } catch {
        return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
    }
}
