
import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { getPaymentConfig } from "@/lib/payment-config";
import { calculateCartTotals } from "@@/lib/payment-utils";

/**
 * POST /api/orders/create
 * Creates an order from user's cart
 */
export async function POST() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch user's cart with items and products
        const cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!cart || cart.items.length === 0) {
            return NextResponse.json(
                { error: "Cart is empty" },
                { status: 400 }
            );
        }

        // Validate stock availability for all items
        for (const item of cart.items) {
            if (!item.product.isActive) {
                return NextResponse.json(
                    { error: `Product "${item.product.title}" is no longer available` },
                    { status: 400 }
                );
            }

            if (item.product.stock < item.quantity) {
                return NextResponse.json(
                    {
                        error: `Insufficient stock for "${item.product.title}". Available: ${item.product.stock}, Requested: ${item.quantity}`
                    },
                    { status: 400 }
                );
            }
        }

        // Calculate total using dynamic configuration
        const config = await getPaymentConfig();
        const totals = calculateCartTotals(cart.items, config);
        const total = totals.total;

        // Create order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId: session.user.id,
                    total, // Using the dynamically calculated total
                    status: "PENDING",
                },
            });

            // Create order items
            await tx.orderItem.createMany({
                data: cart.items.map((item) => ({
                    orderId: newOrder.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.product.price, // Store price at time of purchase
                })),
            });

            // Clear cart items
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return newOrder;
        });

        return NextResponse.json(
            {
                message: "Order created",
                orderId: order.id,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
