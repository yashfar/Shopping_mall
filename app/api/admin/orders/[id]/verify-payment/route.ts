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
 * On approve: status → PAID, stock decremented, confirmation email sent.
 * On reject:  status → PAYMENT_REJECTED (customer can re-upload).
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
                items: { select: { productId: true, quantity: true } },
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
            // Approve: mark as PAID and decrement stock (same logic as old Stripe webhook)
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id },
                    data: { status: "PAID" },
                });

                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: item.quantity },
                        },
                    });
                }

                await tx.product.updateMany({
                    where: {
                        id: { in: order.items.map((i) => i.productId) },
                        stock: { lte: 0 },
                    },
                    data: {
                        isActive: false,
                        stock: 0,
                    },
                });
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
            // Reject: allow customer to re-upload
            await prisma.order.update({
                where: { id },
                data: { status: "PAYMENT_REJECTED" },
            });

            return NextResponse.json({ message: "Payment rejected, customer can re-upload" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}
