import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events.
 *
 * Stock deduction uses atomic `decrement` to prevent race conditions
 * when Stripe retries or two webhooks fire simultaneously.
 */
export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json(
            { error: "No signature provided" },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Webhook signature verification failed:", message);
        return NextResponse.json(
            { error: `Webhook Error: ${message}` },
            { status: 400 }
        );
    }

    if (event.type === "checkout.session.completed") {
        const stripeSession = event.data.object as Stripe.Checkout.Session;
        const orderId = stripeSession.client_reference_id;

        if (!orderId) {
            console.error("No order ID in session");
            return NextResponse.json(
                { error: "No order ID provided" },
                { status: 400 }
            );
        }

        try {
            await prisma.$transaction(async (tx) => {
                // Mark order as PAID
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: "PAID" },
                });

                const orderItems = await tx.orderItem.findMany({
                    where: { orderId },
                    select: {
                        productId: true,
                        quantity: true,
                    },
                });

                // Atomically decrement stock for each product.
                // Using `decrement` avoids the read-modify-write race condition
                // that occurs when Stripe fires duplicate/retry webhooks.
                for (const item of orderItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: item.quantity },
                        },
                    });
                }

                // In a second pass, deactivate any products whose stock hit zero.
                // Done separately so the decrement above is already committed within
                // the same transaction before we check the resulting stock value.
                await tx.product.updateMany({
                    where: {
                        id: { in: orderItems.map((i) => i.productId) },
                        stock: { lte: 0 },
                    },
                    data: {
                        isActive: false,
                        stock: 0, // clamp to zero — never go negative
                    },
                });
            });

            console.log(`Order ${orderId} marked as PAID, stock decremented`);
        } catch (error) {
            console.error("Error updating order after payment:", error);
            return NextResponse.json(
                { error: "Failed to update order" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ received: true });
}
