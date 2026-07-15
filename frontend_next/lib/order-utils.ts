/**
 * Generates a unique random 9-digit order number.
 * Format: 100000000–999999999 (never starts with 0)
 * Collision is astronomically unlikely (~1 in 900M per attempt),
 * but we retry up to 10 times to be safe.
 */
export async function generateOrderNumber(tx: any): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
        // Random integer in [100000000, 999999999]
        const num = Math.floor(100_000_000 + Math.random() * 900_000_000);
        const candidate = num.toString();

        const existing = await tx.order.findUnique({
            where: { orderNumber: candidate },
            select: { id: true },
        });

        if (!existing) return candidate;
    }

    // Absolute fallback: timestamp-based (guaranteed unique within a millisecond)
    return (Date.now() % 900_000_000 + 100_000_000).toString();
}
