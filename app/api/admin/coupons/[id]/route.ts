import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/coupons/[id] - toggle active or update
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { isActive } = body;

        const coupon = await prisma.coupon.update({
            where: { id },
            data: { isActive },
            include: { _count: { select: { usages: true } } },
        });

        return NextResponse.json(coupon);
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
    }
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.coupon.delete({ where: { id } });
        return NextResponse.json({ message: "Coupon deleted" });
    } catch (error: any) {
        if (error?.code === "P2025") {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
    }
}
