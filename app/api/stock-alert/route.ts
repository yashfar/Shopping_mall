import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// GET — check if user has alert for a product
export async function GET(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ subscribed: false });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    const alert = await prisma.stockAlert.findUnique({
        where: {
            userId_productId: {
                userId: session.user.id,
                productId,
            },
        },
    });

    return NextResponse.json({ subscribed: !!alert && !alert.notified });
}

// POST — toggle stock alert
export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();

    if (!productId) {
        return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    const existing = await prisma.stockAlert.findUnique({
        where: {
            userId_productId: {
                userId: session.user.id,
                productId,
            },
        },
    });

    if (existing) {
        await prisma.stockAlert.delete({ where: { id: existing.id } });
        return NextResponse.json({ subscribed: false });
    }

    await prisma.stockAlert.create({
        data: {
            userId: session.user.id,
            productId,
        },
    });

    return NextResponse.json({ subscribed: true });
}
