
/**
 * Generates a unique 9-digit order number.
 * Strategy: Find the latest order number and increment it.
 * Fallback: If no orders exist, start from 100000001.
 */
export async function generateOrderNumber(tx: any): Promise<string> {
    const lastOrder = await tx.order.findFirst({
        orderBy: {
            createdAt: "desc",
        },
        where: {
            orderNumber: { not: null }
        },
        select: {
            orderNumber: true,
        },
    });

    if (lastOrder && lastOrder.orderNumber) {
        const lastNumber = parseInt(lastOrder.orderNumber, 10);
        if (!isNaN(lastNumber)) {
            // Increment and pad
            return (lastNumber + 1).toString().padStart(9, '0');
        }
    }

    // Default start
    return "000000001";
}
