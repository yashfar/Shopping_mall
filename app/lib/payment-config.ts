import { prisma } from "./prisma";

export type PaymentConfigData = {
    taxPercent: number;
    shippingFee: number;
    freeShippingThreshold: number;
};

export type CartTotals = {
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    total: number;
};

/**
 * Retrieves the single PaymentConfig row.
 * Creates one with defaults if it doesn't exist.
 */
export async function getPaymentConfig() {
    const config = await prisma.paymentConfig.findFirst();
    if (config) return config;

    return await prisma.paymentConfig.create({
        data: {
            taxPercent: 0,
            shippingFee: 0, // In cents
            freeShippingThreshold: 0, // In cents
        },
    });
}

/**
 * Updates the PaymentConfig row.
 */
export async function updatePaymentConfig(data: PaymentConfigData) {
    const config = await getPaymentConfig();
    return await prisma.paymentConfig.update({
        where: { id: config.id },
        data,
    });
}

/**
 * Calculates cart totals based on items and configuration.
 * All monetary values (input and output) are in CENTS.
 *
 * Tax model: tax is considered INCLUDED in the product price (display-only).
 * taxAmount is returned for receipt/invoice display but is NOT added on top of
 * the subtotal. This keeps the formula consistent with lib/payment-utils.ts:
 *
 *   total = subtotal + shippingAmount
 */
export function calculateCartTotals(
    items: { product: { price: number }; quantity: number }[],
    config: { taxPercent: number; shippingFee: number; freeShippingThreshold: number }
): CartTotals {
    const subtotal = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    // Tax is for display / reporting only — not charged on top of subtotal
    const taxAmount = Math.round(subtotal * (config.taxPercent / 100));

    // Free shipping when subtotal meets or exceeds the threshold.
    // Set freeShippingThreshold to a very high value to effectively disable free shipping.
    const shippingAmount =
        subtotal >= config.freeShippingThreshold ? 0 : config.shippingFee;

    const total = subtotal + shippingAmount;

    return {
        subtotal,
        taxAmount,
        shippingAmount,
        total,
    };
}
