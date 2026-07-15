
export type CartTotals = {
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    total: number;
};

/**
 * Calculates cart totals based on items and configuration.
 * All monetary values (input and output) are in CENTS.
 * 
 * @param items List of cart items with price and quantity
 * @param config Payment configuration (taxPercent, shippingFee, freeShippingThreshold)
 */
export function calculateCartTotals(
    items: { product: { price: number }; quantity: number }[],
    config: { taxPercent: number; shippingFee: number; freeShippingThreshold: number }
): CartTotals {
    const subtotal = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    // Calculate Tax (Included in price, calculated for reporting)
    // The user requested: taxAmount = subtotal * (taxPercent / 100)
    const taxAmount = Math.round(subtotal * (config.taxPercent / 100));

    // Calculate Shipping
    const shippingAmount = subtotal >= config.freeShippingThreshold
        ? 0
        : config.shippingFee;

    // Total = Subtotal (which includes tax) + Shipping
    // Tax is NOT added on top.
    const total = subtotal + shippingAmount;

    return {
        subtotal,
        taxAmount,
        shippingAmount,
        total
    };
}
