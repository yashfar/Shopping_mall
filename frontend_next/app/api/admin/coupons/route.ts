import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// GET /api/admin/coupons
export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { usages: true } } },
        });
        return NextResponse.json(coupons);
    } catch {
        return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
    }
}

// POST /api/admin/coupons
export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { code, type, value, minAmount, maxUses, expiresAt, isActive } = body;

        if (!code || !type || !value) {
            return NextResponse.json({ error: "code, type and value are required" }, { status: 400 });
        }

        if (!["PERCENTAGE", "FIXED_AMOUNT"].includes(type)) {
            return NextResponse.json({ error: "type must be PERCENTAGE or FIXED_AMOUNT" }, { status: 400 });
        }

        if (type === "PERCENTAGE" && (value <= 0 || value > 100)) {
            return NextResponse.json({ error: "Percentage must be between 1 and 100" }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.trim().toUpperCase(),
                type,
                value: Number(value),
                minAmount: minAmount ? Number(minAmount) : null,
                maxUses: maxUses ? Number(maxUses) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                isActive: isActive !== false,
            },
            include: { _count: { select: { usages: true } } },
        });

        return NextResponse.json(coupon, { status: 201 });
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
    }
}
