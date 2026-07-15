import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/orders/[id]/cancel
 * Cancels a PENDING order and restores product stock.
 * Only the order owner can cancel.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: {
                    items: { select: { productId: true, quantity: true } },
                },
            });

            if (!order) {
                throw new Error("NOT_FOUND");
            }

            if (order.userId !== session.user.id) {
                throw new Error("FORBIDDEN");
            }

            if (order.status !== "PENDING") {
                throw new Error("NOT_CANCELABLE");
            }

            // Restore stock for each item
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        isActive: true,
                    },
                });
            }

            await tx.order.update({
                where: { id },
                data: { status: "CANCELED" },
            });
        });

        return NextResponse.json({ message: "Order canceled" });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === "NOT_FOUND") {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }
            if (error.message === "FORBIDDEN") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            if (error.message === "NOT_CANCELABLE") {
                return NextResponse.json({ error: "Only PENDING orders can be canceled" }, { status: 400 });
            }
        }
        return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
    }
}
