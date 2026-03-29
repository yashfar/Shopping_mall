import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

/**
 * POST /api/checkout
 * Creates a Stripe Checkout Session for an order.
 *
 * The Stripe total must exactly match order.total stored in the DB.
 * order.total = itemsSubtotal + shippingAmount  (tax is display-only, not charged on top)
 * So we derive shippingAmount = order.total - itemsSubtotal and add it as a line item.
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

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true } },
                coupon: { select: { code: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (order.status !== "PENDING") {
            return NextResponse.json(
                { error: "Order is not pending payment" },
                { status: 400 }
            );
        }

        // Build line items from order snapshot prices
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
            order.items.map((item) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.product.title,
                        description: item.product.description || undefined,
                    },
                    unit_amount: item.price, // cents, snapshot at order creation
                },
                quantity: item.quantity,
            }));

        const discountAmount = order.discountAmount ?? 0;
        const itemsSubtotal = order.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // Restore original shipping before discount:
        // order.total = itemsSubtotal + shipping - discount
        // → shipping = order.total + discount - itemsSubtotal
        const shippingAmount = order.total + discountAmount - itemsSubtotal;

        if (shippingAmount > 0) {
            lineItems.push({
                price_data: {
                    currency: "usd",
                    product_data: { name: "Shipping" },
                    unit_amount: shippingAmount,
                },
                quantity: 1,
            });
        }

        // If a coupon was applied, create a one-time Stripe coupon so the
        // discount appears as its own line on the Stripe checkout page.
        const discounts: { coupon: string }[] = [];
        if (discountAmount > 0) {
            const stripeCoupon = await stripe.coupons.create({
                amount_off: discountAmount,
                currency: "usd",
                duration: "once",
                max_redemptions: 1,
                name: order.coupon?.code ? `Coupon: ${order.coupon.code}` : "Discount",
            });
            discounts.push({ coupon: stripeCoupon.id });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            client_reference_id: order.id,
            line_items: lineItems,
            ...(discounts.length > 0 ? { discounts } : {}),
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
