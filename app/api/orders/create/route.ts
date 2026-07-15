import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { getPaymentConfig } from "@/lib/payment-config";
import { calculateTotalsFromPrices } from "@@/lib/payment-utils";
import { generateOrderNumber } from "@@/lib/order-utils";
import { getLocaleFromRequest } from "@@/lib/get-locale";
import { formatPrice } from "@@/lib/format-price";

/**
 * POST /api/orders/create
 * Creates an order from the user's cart.
 *
 * Body: { couponCode?: string, currencyCode?: "TRY" | "USD" }
 *
 * Total is calculated entirely on the backend from ProductPrice records —
 * the frontend total is never trusted.
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

    const locale = getLocaleFromRequest(req);
    let currencyCode: "TRY" | "USD" = "TRY";

    try {
        const body = await req.json().catch(() => ({}));
        const couponCode: string | undefined = body?.couponCode?.trim().toUpperCase() || undefined;
        const rawCurrency: string = body?.currencyCode ?? "TRY";
        currencyCode = rawCurrency === "USD" ? "USD" : "TRY";

        const config = await getPaymentConfig();

        // Verify USD bank account is configured before allowing a USD order
        if (currencyCode === "USD") {
            if (!config.usdBankName || !config.usdIban) {
                return NextResponse.json(
                    { error: "USD payments are not available at this time" },
                    { status: 400 }
                );
            }
        }

        // Shipping config for the chosen currency
        const effectiveShipping = currencyCode === "USD"
            ? { shippingFee: config.usdShippingFee, freeShippingThreshold: config.usdFreeShippingThreshold }
            : { shippingFee: config.shippingFee, freeShippingThreshold: config.freeShippingThreshold };

        const order = await prisma.$transaction(async (tx) => {
            // Save customer locale so all future emails use the right language
            await tx.user.update({ where: { id: session.user.id }, data: { locale } });

            // Re-fetch the cart inside the transaction so we're reading
            // consistent data for both validation and order creation.
            const cart = await tx.cart.findUnique({
                where: { userId: session.user.id },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    prices: {
                                        select: { currencyCode: true, price: true, salePrice: true },
                                    },
                                },
                            },
                            variant: true,
                        },
                    },
                },
            });

            if (!cart || cart.items.length === 0) {
                throw new Error("CART_EMPTY");
            }

            // Validate stock inside the transaction — prevents race conditions
            for (const item of cart.items) {
                if (!item.product.isActive) {
                    throw new Error(`PRODUCT_INACTIVE:${item.product.title}`);
                }
                const availableStock = item.variant ? item.variant.stock : item.product.stock;
                if (availableStock < item.quantity) {
                    throw new Error(
                        `INSUFFICIENT_STOCK:${item.product.title}:${availableStock}:${item.quantity}`
                    );
                }
            }

            // Resolve the effective price for each item in the chosen currency.
            // Snapshot happens here — changing product prices later will NOT
            // affect this order because we write the resolved price to OrderItem.
            const resolvedItems: {
                productId: string;
                variantId: string | null;
                variantColor: string | null;
                quantity: number;
                price: number; // minor units in the chosen currency
            }[] = [];

            for (const item of cart.items) {
                const priceEntry = item.product.prices.find((p) => p.currencyCode === currencyCode);
                if (!priceEntry) {
                    throw new Error(`NO_PRICE_FOR_CURRENCY:${item.product.title}:${currencyCode}`);
                }
                resolvedItems.push({
                    productId: item.productId,
                    variantId: item.variantId ?? null,
                    variantColor: item.variant?.color ?? null,
                    quantity: item.quantity,
                    price: priceEntry.salePrice ?? priceEntry.price,
                });
            }

            const totals = calculateTotalsFromPrices(
                resolvedItems.map((i) => ({ price: i.price, quantity: i.quantity })),
                { taxPercent: config.taxPercent, ...effectiveShipping }
            );

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
                    currencyCode,
                    status: "PENDING",
                    ...(coupon ? { couponId: coupon.id, discountAmount } : {}),
                },
            });

            // Snapshot resolved prices — changes to product prices later will
            // not alter this order's line items
            await tx.orderItem.createMany({
                data: resolvedItems.map((item) => ({
                    orderId: newOrder.id,
                    productId: item.productId,
                    variantId: item.variantId,
                    variantColor: item.variantColor,
                    quantity: item.quantity,
                    price: item.price,
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

            // Cart is cleared when the customer uploads payment proof,
            // not here — so "back to cart" still shows their items.

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
                return NextResponse.json(
                    { error: `Minimum order amount of ${formatPrice(minAmount, currencyCode)} required` },
                    { status: 400 }
                );
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
                    { error: `Insufficient stock for "${title}". Available: ${available}, Requested: ${requested}` },
                    { status: 400 }
                );
            }
            if (error.message.startsWith("NO_PRICE_FOR_CURRENCY:")) {
                const [, title, currency] = error.message.split(":");
                return NextResponse.json(
                    { error: `Product "${title}" does not have a ${currency} price. Please switch to TRY or contact support.` },
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
