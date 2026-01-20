import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

/**
 * POST /api/checkout
 * Creates a Stripe Checkout Session for an order
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        // Fetch order with items and products
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Verify order belongs to user
        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verify order is pending
        if (order.status !== "PENDING") {
            return NextResponse.json(
                { error: "Order is not pending payment" },
                { status: 400 }
            );
        }

        // Create Stripe Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            client_reference_id: order.id,
            line_items: order.items.map((item) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.product.title,
                        description: item.product.description || undefined,
                    },
                    unit_amount: item.price, // Already in cents
                },
                quantity: item.quantity,
            })),
            success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?orderId=${order.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/cancel`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
