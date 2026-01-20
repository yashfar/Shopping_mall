import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
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
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error("Webhook signature verification failed:", error.message);
        return NextResponse.json(
            { error: `Webhook Error: ${error.message}` },
            { status: 400 }
        );
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.client_reference_id;

        if (!orderId) {
            console.error("No order ID in session");
            return NextResponse.json(
                { error: "No order ID provided" },
                { status: 400 }
            );
        }

        try {
            // Update order status and reduce stock in a transaction
            await prisma.$transaction(async (tx) => {
                // Update order status to PAID
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: "PAID" },
                });

                // Fetch order items to reduce stock
                const orderItems = await tx.orderItem.findMany({
                    where: { orderId },
                    include: { product: true },
                });

                // Reduce stock for each product
                for (const item of orderItems) {
                    const newStock = item.product.stock - item.quantity;

                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: newStock,
                            // Auto-deactivate if stock reaches 0
                            isActive: newStock > 0 ? item.product.isActive : false,
                        },
                    });
                }
            });

            console.log(`Order ${orderId} marked as PAID and stock reduced`);
        } catch (error) {
            console.error("Error updating order:", error);
            return NextResponse.json(
                { error: "Failed to update order" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ received: true });
}
