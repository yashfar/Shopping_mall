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
 */
export function calculateCartTotals(
    items: { product: { price: number }; quantity: number }[],
    config: { taxPercent: number; shippingFee: number; freeShippingThreshold: number }
): CartTotals {
    const subtotal = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    // Calculate Tax
    // taxPercent is e.g. 8 for 8%. 
    const taxAmount = Math.round(subtotal * (config.taxPercent / 100));

    // Calculate Shipping
    // If threshold is 0, assumes no free shipping threshold? 
    // Or if subtotal >= threshold (if threshold > 0).
    // Usually if threshold is 0, it might mean "always free" or "never free".
    // Let's assume if threshold > 0, logic applies. If threshold is 0, maybe it means NO free shipping? 
    // Or the user can set threshold to a very high number to disable it.
    // The prompt says: "if cart subtotal >= threshold → shipping = 0".
    // If threshold is 0, 0 >= 0 is true -> Free shipping always.
    // Ideally defaults should be set such that:
    // shippingFee = 0 -> Free shipping always.
    // shippingFee > 0, threshold = 0 -> Free shipping always? (0 >= 0).
    // If I want to charge shipping, I should set threshold high.
    // Or maybe if threshold is 0, `subtotal >= 0` is always true. 
    // Let's stick to the prompt's logic: `subtotal >= freeShippingThreshold ? 0 : shippingFee`.

    // There is a edge case: user might want shipping fee but NO free shipping.
    // They can set threshold to Infinity (or max int).

    const shippingAmount = subtotal >= config.freeShippingThreshold
        ? 0
        : config.shippingFee;

    const total = subtotal + taxAmount + shippingAmount;

    return {
        subtotal,
        taxAmount,
        shippingAmount,
        total
    };
}
