import type { Payment, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type TransactionClient = Prisma.TransactionClient;

export type PaymentTransitionResult = {
    payment: Payment;
    transitioned: boolean;
};

export type PaymentFailure = {
    failureCode?: string;
    failureMessage?: string;
};

async function requirePayment(db: TransactionClient, paymentId: string) {
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error("Payment not found");
    return payment;
}

export async function markPaymentProcessing(
    paymentId: string,
    tx?: TransactionClient,
): Promise<PaymentTransitionResult> {
    const db = tx ?? prisma;
    const result = await db.payment.updateMany({
        where: { id: paymentId, status: { not: "SUCCESS" } },
        data: { status: "PROCESSING" },
    });
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error("Payment not found");
    return { payment, transitioned: result.count === 1 };
}

export async function markPaymentSuccessful(
    paymentId: string,
    tx?: TransactionClient,
): Promise<PaymentTransitionResult> {
    const transition = async (db: TransactionClient) => {
        const existing = await requirePayment(db, paymentId);
        const result = await db.payment.updateMany({
            where: { id: paymentId, status: { not: "SUCCESS" } },
            data: {
                status: "SUCCESS",
                paidAt: existing.paidAt ?? new Date(),
            },
        });

        await db.order.updateMany({
            where: { id: existing.orderId, status: { not: "PAID" } },
            data: { status: "PAID" },
        });

        return {
            payment: await requirePayment(db, paymentId),
            transitioned: result.count === 1,
        };
    };

    return tx ? transition(tx) : prisma.$transaction(transition);
}

export async function markPaymentFailed(
    paymentId: string,
    failure: PaymentFailure = {},
    tx?: TransactionClient,
): Promise<PaymentTransitionResult> {
    const db = tx ?? prisma;
    const result = await db.payment.updateMany({
        where: { id: paymentId, status: { not: "SUCCESS" } },
        data: {
            status: "FAILED",
            failureCode: failure.failureCode,
            failureMessage: failure.failureMessage,
        },
    });
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error("Payment not found");
    return { payment, transitioned: result.count === 1 };
}
