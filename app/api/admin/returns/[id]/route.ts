import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { sendReturnResultEmail } from "@@/lib/mail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const { action, adminNote } = await req.json();

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        items: true,
                        user: {
                            select: { email: true, firstName: true },
                        },
                    },
                },
            },
        });

        if (!returnRequest) {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }

        if (returnRequest.status !== "PENDING") {
            return NextResponse.json({ error: "This return request has already been processed" }, { status: 400 });
        }

        if (action === "approve") {
            // Try to find Stripe checkout session and refund
            let refunded = false;
            try {
                const sessions = await stripe.checkout.sessions.list({
                    limit: 1,
                } as any);

                // Search for session with this order's ID
                const allSessions = await stripe.checkout.sessions.list({ limit: 100 });
                const matchingSession = allSessions.data.find(
                    (s) => s.client_reference_id === returnRequest.orderId
                );

                if (matchingSession?.payment_intent) {
                    await stripe.refunds.create({
                        payment_intent: matchingSession.payment_intent as string,
                    });
                    refunded = true;
                }
            } catch (stripeErr) {
                console.error("Stripe refund failed:", stripeErr);
                // Continue even if refund fails — admin can refund manually
            }

            await prisma.$transaction(async (tx) => {
                // Update return request status
                await tx.returnRequest.update({
                    where: { id },
                    data: {
                        status: "APPROVED",
                        adminNote: adminNote?.trim() || (refunded ? "Approved — Stripe refund issued" : "Approved — manual refund required"),
                    },
                });

                // Update order status
                await tx.order.update({
                    where: { id: returnRequest.orderId },
                    data: { status: "RETURNED" },
                });

                // Restore stock
                for (const item of returnRequest.order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.quantity },
                            isActive: true,
                        },
                    });
                }
            });

            // Send email notification (non-blocking)
            try {
                await sendReturnResultEmail(returnRequest.order.user.email, {
                    orderNumber: returnRequest.order.orderNumber || returnRequest.orderId.substring(0, 8),
                    firstName: returnRequest.order.user.firstName,
                    approved: true,
                    adminNote: adminNote?.trim() || null,
                    total: returnRequest.order.total,
                });
            } catch (emailErr) {
                console.error("Failed to send return approval email:", emailErr);
            }

            return NextResponse.json({
                message: "Return approved",
                refunded,
            });
        } else {
            // Reject — restore order to its previous status
            const previousStatus = (returnRequest as any).previousStatus || "PAID";

            await prisma.$transaction(async (tx) => {
                await tx.returnRequest.update({
                    where: { id },
                    data: {
                        status: "REJECTED",
                        adminNote: adminNote?.trim() || "Return request rejected",
                    },
                });

                await tx.order.update({
                    where: { id: returnRequest.orderId },
                    data: { status: previousStatus },
                });
            });

            // Send email notification (non-blocking)
            try {
                await sendReturnResultEmail(returnRequest.order.user.email, {
                    orderNumber: returnRequest.order.orderNumber || returnRequest.orderId.substring(0, 8),
                    firstName: returnRequest.order.user.firstName,
                    approved: false,
                    adminNote: adminNote?.trim() || null,
                    total: returnRequest.order.total,
                });
            } catch (emailErr) {
                console.error("Failed to send return rejection email:", emailErr);
            }

            return NextResponse.json({ message: "Return rejected" });
        }
    } catch (error) {
        console.error("Error processing return:", error);
        return NextResponse.json({ error: "Failed to process return request" }, { status: 500 });
    }
}
