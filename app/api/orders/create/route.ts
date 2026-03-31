import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { getPaymentConfig } from "@/lib/payment-config";
import { calculateCartTotals } from "@@/lib/payment-utils";
import { generateOrderNumber } from "@@/lib/order-utils";

/**
 * POST /api/orders/create
 * Creates an order from the user's cart.
 *
 * Stock validation is performed INSIDE the transaction so that two
 * concurrent checkouts cannot both pass the availability check and
 * both succeed for the same limited-stock item.
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const couponCode: string | undefined = body?.couponCode?.trim().toUpperCase() || undefined;

        const config = await getPaymentConfig();

        const order = await prisma.$transaction(async (tx) => {
            // Re-fetch the cart inside the transaction so we're reading
            // consistent data for both validation and order creation.
            const cart = await tx.cart.findUnique({
                where: { userId: session.user.id },
                include: {
                    items: {
                        include: { product: true },
                    },
                },
            });

            if (!cart || cart.items.length === 0) {
                throw new Error("CART_EMPTY");
            }

            // Validate stock inside the transaction — this prevents the race
            // condition where two simultaneous requests both pass an external check.
            for (const item of cart.items) {
                if (!item.product.isActive) {
                    throw new Error(`PRODUCT_INACTIVE:${item.product.title}`);
                }
                if (item.product.stock < item.quantity) {
                    throw new Error(
                        `INSUFFICIENT_STOCK:${item.product.title}:${item.product.stock}:${item.quantity}`
                    );
                }
            }

            const totals = calculateCartTotals(cart.items, config);

            // Validate coupon inside transaction
            let discountAmount = 0;
            let coupon = null;
            if (couponCode) {
                coupon = await tx.coupon.findUnique({
                    where: { code: couponCode },
                    include: {
                        usages: { where: { userId: session.user.id } },
                    },
                });

                if (!coupon || !coupon.isActive) {
                    throw new Error("INVALID_COUPON");
                }
                if (coupon.expiresAt && coupon.expiresAt < new Date()) {
                    throw new Error("COUPON_EXPIRED");
                }
                if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
                    throw new Error("COUPON_LIMIT_REACHED");
                }
                if (coupon.usages.length > 0) {
                    throw new Error("COUPON_ALREADY_USED");
                }
                if (coupon.minAmount !== null && totals.subtotal < coupon.minAmount) {
                    throw new Error(`COUPON_MIN_AMOUNT:${coupon.minAmount}`);
                }

                if (coupon.type === "PERCENTAGE") {
                    discountAmount = Math.round(totals.subtotal * (coupon.value / 100));
                } else {
                    discountAmount = Math.min(coupon.value, totals.subtotal);
                }
            }

            const finalTotal = Math.max(0, totals.total - discountAmount);

            const newOrder = await tx.order.create({
                data: {
                    userId: session.user.id,
                    orderNumber: await generateOrderNumber(tx),
                    total: finalTotal,
                    status: "PENDING",
                    ...(coupon ? { couponId: coupon.id, discountAmount } : {}),
                },
            });

            await tx.orderItem.createMany({
                data: cart.items.map((item) => ({
                    orderId: newOrder.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.product.price,
                })),
            });

            if (coupon) {
                await tx.couponUsage.create({
                    data: {
                        couponId: coupon.id,
                        userId: session.user.id,
                        orderId: newOrder.id,
                    },
                });
                await tx.coupon.update({
                    where: { id: coupon.id },
                    data: { usedCount: { increment: 1 } },
                });
            }

            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return newOrder;
        });

        return NextResponse.json(
            { message: "Order created", orderId: order.id },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === "CART_EMPTY") {
                return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
            }
            if (error.message === "INVALID_COUPON") {
                return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 400 });
            }
            if (error.message === "COUPON_EXPIRED") {
                return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
            }
            if (error.message === "COUPON_LIMIT_REACHED") {
                return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
            }
            if (error.message === "COUPON_ALREADY_USED") {
                return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
            }
            if (error.message.startsWith("COUPON_MIN_AMOUNT:")) {
                const minAmount = parseInt(error.message.split(":")[1]);
                return NextResponse.json({ error: `Minimum order amount of ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(minAmount / 100)} required` }, { status: 400 });
            }
            if (error.message.startsWith("PRODUCT_INACTIVE:")) {
                const title = error.message.split(":")[1];
                return NextResponse.json(
                    { error: `Product "${title}" is no longer available` },
                    { status: 400 }
                );
            }
            if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
                const [, title, available, requested] = error.message.split(":");
                return NextResponse.json(
                    {
                        error: `Insufficient stock for "${title}". Available: ${available}, Requested: ${requested}`,
                    },
                    { status: 400 }
                );
            }
        }

        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
