import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/coupon/validate
 * Validates a coupon code and returns the discount amount.
 * Body: { code: string, subtotal: number (cents) }
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { code, subtotal } = await req.json();

        if (!code || typeof code !== "string") {
            return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.trim().toUpperCase() },
            include: {
                usages: {
                    where: { userId: session.user.id },
                },
            },
        });

        if (!coupon || !coupon.isActive) {
            return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 404 });
        }

        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
        }

        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
        }

        if (coupon.usages.length > 0) {
            return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
        }

        if (coupon.minAmount !== null && subtotal < coupon.minAmount) {
            return NextResponse.json({
                error: `Minimum order amount of ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(coupon.minAmount / 100)} required for this coupon`,
            }, { status: 400 });
        }

        let discountAmount: number;
        if (coupon.type === "PERCENTAGE") {
            discountAmount = Math.round(subtotal * (coupon.value / 100));
        } else {
            discountAmount = Math.min(coupon.value, subtotal); // can't discount more than subtotal
        }

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discountAmount,
        });
    } catch {
        return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
    }
}
