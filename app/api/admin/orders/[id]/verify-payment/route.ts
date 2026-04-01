import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@@/lib/mail";

/**
 * POST /api/admin/orders/[id]/verify-payment
 * Admin approves or rejects a bank transfer payment proof.
 *
 * Body: { action: "approve" | "reject" }
 *
 * On approve: status → PAID, confirmation email sent.
 *             Stock was already decremented when customer uploaded the proof.
 * On reject:  status → PAYMENT_REJECTED, stock restored (variant-aware).
 *             Customer can re-upload; stock will be decremented again on re-upload.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const { action } = await req.json();

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: { select: { productId: true, variantId: true, quantity: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.status !== "PAYMENT_UPLOADED") {
            return NextResponse.json(
                { error: "Order does not have a pending payment proof to verify" },
                { status: 400 }
            );
        }

        if (action === "approve") {
            // Stock was already decremented on upload — just mark as PAID
            await prisma.order.update({
                where: { id },
                data: { status: "PAID" },
            });

            // Send confirmation email (non-critical)
            try {
                const fullOrder = await prisma.order.findUnique({
                    where: { id },
                    select: {
                        orderNumber: true,
                        total: true,
                        user: { select: { email: true, firstName: true } },
                        items: {
                            select: {
                                quantity: true,
                                price: true,
                                product: {
                                    select: { title: true, thumbnail: true },
                                },
                            },
                        },
                    },
                });

                if (fullOrder?.orderNumber) {
                    await sendOrderConfirmationEmail(fullOrder.user.email, {
                        orderNumber: fullOrder.orderNumber,
                        total: fullOrder.total,
                        firstName: fullOrder.user.firstName,
                        items: fullOrder.items.map((item) => ({
                            title: item.product.title,
                            quantity: item.quantity,
                            price: item.price,
                            thumbnail: item.product.thumbnail,
                        })),
                    });
                }
            } catch (emailErr) {
                console.error("Failed to send order confirmation email:", emailErr);
            }

            return NextResponse.json({ message: "Payment approved, order marked as PAID" });
        } else {
            // Reject: restore stock and allow customer to re-upload
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id },
                    data: { status: "PAYMENT_REJECTED" },
                });

                const variantProductIds = new Set<string>();

                for (const item of order.items) {
                    if (item.variantId) {
                        // Restore variant stock
                        await tx.productVariant.update({
                            where: { id: item.variantId },
                            data: { stock: { increment: item.quantity } },
                        });
                        variantProductIds.add(item.productId);
                    } else {
                        // Restore product stock directly
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { increment: item.quantity } },
                        });
                    }
                }

                // Sync product.stock = sum of variant stocks for variant products
                for (const productId of variantProductIds) {
                    const variants = await tx.productVariant.findMany({
                        where: { productId },
                        select: { stock: true },
                    });
                    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
                    await tx.product.update({
                        where: { id: productId },
                        data: {
                            stock: totalStock,
                            // Re-activate product if stock was restored
                            ...(totalStock > 0 ? { isActive: true } : {}),
                        },
                    });
                }

                // Re-activate non-variant products that now have stock
                const nonVariantProductIds = order.items
                    .filter((i) => !i.variantId)
                    .map((i) => i.productId);

                if (nonVariantProductIds.length > 0) {
                    await tx.product.updateMany({
                        where: {
                            id: { in: nonVariantProductIds },
                            stock: { gt: 0 },
                        },
                        data: { isActive: true },
                    });
                }
            });

            return NextResponse.json({ message: "Payment rejected, stock restored, customer can re-upload" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}
