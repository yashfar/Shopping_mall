import "server-only";

import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@@/lib/mail";

export class PaymentCompletionError extends Error {
    constructor(readonly code: string) {
        super(code);
    }
}

export type PaymentCompletionResult = {
    fulfillmentApplied: boolean;
    confirmationEmailSent: boolean;
};

export async function completeSuccessfulPayment(
    paymentId: string,
): Promise<PaymentCompletionResult> {
    const fulfillmentApplied = await prisma.$transaction(async (tx) => {
        const paymentIdentity = await tx.payment.findUnique({
            where: { id: paymentId },
            select: { orderId: true },
        });
        if (!paymentIdentity) throw new PaymentCompletionError("PAYMENT_NOT_FOUND");

        const lockedOrder = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "Order" WHERE "id" = ${paymentIdentity.orderId} FOR UPDATE
        `;
        if (lockedOrder.length !== 1) throw new PaymentCompletionError("ORDER_NOT_FOUND");

        const payment = await tx.payment.findUnique({
            where: { id: paymentId },
            include: {
                order: {
                    include: {
                        items: { select: { productId: true, variantId: true, quantity: true } },
                        payments: {
                            select: {
                                id: true,
                                fulfillmentAppliedAt: true,
                                confirmationEmailSentAt: true,
                            },
                        },
                    },
                },
            },
        });
        if (!payment) throw new PaymentCompletionError("PAYMENT_NOT_FOUND");
        if (payment.status !== "SUCCESS" || payment.order.status !== "PAID") {
            throw new PaymentCompletionError("PAYMENT_NOT_SUCCESSFUL");
        }
        if (payment.fulfillmentAppliedAt) return false;

        const priorFulfillment = payment.order.payments.find(
            (candidate) => candidate.id !== payment.id && candidate.fulfillmentAppliedAt,
        );
        if (priorFulfillment?.fulfillmentAppliedAt) {
            const priorConfirmation = payment.order.payments.find(
                (candidate) => candidate.confirmationEmailSentAt,
            );
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    fulfillmentAppliedAt: priorFulfillment.fulfillmentAppliedAt,
                    confirmationEmailSentAt: priorConfirmation?.confirmationEmailSentAt,
                },
            });
            return false;
        }
        if (
            payment.order.items.length === 0
            || payment.order.items.some((item) => item.quantity <= 0)
        ) {
            throw new PaymentCompletionError("INVALID_ORDER_ITEMS");
        }

        const variantRequirements = new Map<string, { productId: string; quantity: number }>();
        const productRequirements = new Map<string, number>();
        for (const item of payment.order.items) {
            if (item.variantId) {
                const requirement = variantRequirements.get(item.variantId);
                variantRequirements.set(item.variantId, {
                    productId: item.productId,
                    quantity: (requirement?.quantity ?? 0) + item.quantity,
                });
            } else {
                productRequirements.set(
                    item.productId,
                    (productRequirements.get(item.productId) ?? 0) + item.quantity,
                );
            }
        }

        const affectedProductIds = [...new Set(
            payment.order.items.map((item) => item.productId),
        )].sort();
        for (const productId of affectedProductIds) {
            const products = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT "id" FROM "Product" WHERE "id" = ${productId} FOR UPDATE
            `;
            if (products.length !== 1) throw new PaymentCompletionError("PRODUCT_NOT_FOUND");
        }

        for (const [variantId, requirement] of variantRequirements) {
            const updated = await tx.productVariant.updateMany({
                where: { id: variantId, stock: { gte: requirement.quantity } },
                data: { stock: { decrement: requirement.quantity } },
            });
            if (updated.count !== 1) throw new PaymentCompletionError("INSUFFICIENT_STOCK");
        }
        for (const [productId, quantity] of productRequirements) {
            const updated = await tx.product.updateMany({
                where: { id: productId, stock: { gte: quantity } },
                data: { stock: { decrement: quantity } },
            });
            if (updated.count !== 1) throw new PaymentCompletionError("INSUFFICIENT_STOCK");
        }

        for (const productId of new Set(
            Array.from(variantRequirements.values(), ({ productId }) => productId),
        )) {
            const variants = await tx.productVariant.findMany({
                where: { productId },
                select: { stock: true },
            });
            const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
            await tx.product.update({
                where: { id: productId },
                data: {
                    stock: totalStock,
                    ...(totalStock <= 0 ? { isActive: false } : {}),
                },
            });
        }

        if (productRequirements.size > 0) {
            await tx.product.updateMany({
                where: { id: { in: [...productRequirements.keys()] }, stock: { lte: 0 } },
                data: { stock: 0, isActive: false },
            });
        }

        const cart = await tx.cart.findUnique({
            where: { userId: payment.order.userId },
            select: { id: true },
        });
        if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        await tx.payment.update({
            where: { id: payment.id },
            data: { fulfillmentAppliedAt: new Date() },
        });
        return true;
    });

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: {
            status: true,
            provider: true,
            method: true,
            orderId: true,
            fulfillmentAppliedAt: true,
            confirmationEmailSentAt: true,
            order: {
                select: {
                    orderNumber: true,
                    total: true,
                    user: { select: { email: true, firstName: true, locale: true } },
                    items: {
                        select: {
                            quantity: true,
                            price: true,
                            product: { select: { title: true, thumbnail: true } },
                        },
                    },
                    payments: {
                        select: { confirmationEmailSentAt: true },
                    },
                },
            },
        },
    });
    if (!payment) throw new PaymentCompletionError("PAYMENT_NOT_FOUND");
    if (
        payment.status !== "SUCCESS"
        || !payment.fulfillmentAppliedAt
    ) {
        throw new PaymentCompletionError("PAYMENT_NOT_READY_FOR_EMAIL");
    }
    if (payment.confirmationEmailSentAt || payment.order.payments.some(
        (candidate) => candidate.confirmationEmailSentAt,
    )) {
        return { fulfillmentApplied, confirmationEmailSent: false };
    }

    const orderNumber = payment.order.orderNumber || paymentId.substring(0, 8);
    const emailResult = await sendOrderConfirmationEmail(
        payment.order.user.email,
        {
            orderNumber,
            total: payment.order.total,
            firstName: payment.order.user.firstName,
            locale: payment.order.user.locale === "tr" ? "tr" : "en",
            items: payment.order.items.map((item) => ({
                title: item.product.title,
                quantity: item.quantity,
                price: item.price,
                thumbnail: item.product.thumbnail,
            })),
        },
        { idempotencyKey: `order-confirmation-${payment.orderId}` },
    );
    if (!emailResult.success) throw new PaymentCompletionError("CONFIRMATION_EMAIL_FAILED");

    await prisma.payment.updateMany({
        where: { id: paymentId, confirmationEmailSentAt: null },
        data: { confirmationEmailSentAt: new Date() },
    });
    return { fulfillmentApplied, confirmationEmailSent: true };
}

export async function completeSuccessfulIyzicoPayment(
    paymentId: string,
): Promise<PaymentCompletionResult> {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { provider: true, method: true },
    });
    if (!payment) throw new PaymentCompletionError("PAYMENT_NOT_FOUND");
    if (payment.provider !== "IYZICO" || payment.method !== "IYZICO") {
        throw new PaymentCompletionError("INVALID_PAYMENT_PROVIDER");
    }
    return completeSuccessfulPayment(paymentId);
}
