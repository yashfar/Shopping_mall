import "server-only";

import { markPaymentSuccessful } from "@@/lib/payment-service";
import { completeSuccessfulPayment } from "@@/lib/payments/payment-completion";
import { isIyzicoProcessingSessionActive } from "@@/lib/payments/iyzico-session";
import { prisma } from "@/lib/prisma";

export class ManualPaymentError extends Error {
    constructor(readonly code: string, readonly status: number) {
        super(code);
    }
}

export type ManualSettlementInput = {
    orderId: string;
    adminUserId: string;
    method: "BANK_TRANSFER" | "CASH";
    amount: number;
    paidAt: Date;
    note?: string;
    reference?: string;
    confirmActiveIyzico?: boolean;
};

export async function settleOrderManually(input: ManualSettlementInput) {
    const note = input.note?.trim() ?? "";
    const reference = input.reference?.trim() ?? "";
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
        throw new ManualPaymentError("INVALID_PAYMENT_AMOUNT", 400);
    }
    if (note.length > 500 || reference.length > 120) {
        throw new ManualPaymentError("PAYMENT_AUDIT_TEXT_TOO_LONG", 400);
    }
    if (Number.isNaN(input.paidAt.getTime())) {
        throw new ManualPaymentError("INVALID_PAYMENT_DATE", 400);
    }

    const paymentId = await prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "Order" WHERE "id" = ${input.orderId} FOR UPDATE
        `;
        if (locked.length !== 1) throw new ManualPaymentError("ORDER_NOT_FOUND", 404);

        const order = await tx.order.findUnique({
            where: { id: input.orderId },
            include: { payments: { orderBy: { createdAt: "desc" } } },
        });
        if (!order) throw new ManualPaymentError("ORDER_NOT_FOUND", 404);
        if (
            order.status === "PAID"
            || order.status === "SHIPPED"
            || order.status === "COMPLETED"
            || order.payments.some((payment) => payment.status === "SUCCESS")
        ) {
            throw new ManualPaymentError("ORDER_ALREADY_PAID", 409);
        }
        if (order.status === "PAYMENT_UPLOADED") {
            throw new ManualPaymentError("USE_BANK_TRANSFER_APPROVAL", 409);
        }
        if (order.status !== "PENDING" && order.status !== "PAYMENT_REJECTED") {
            throw new ManualPaymentError("ORDER_NOT_SETTLEABLE", 409);
        }
        if (input.amount !== order.total) {
            throw new ManualPaymentError("PAYMENT_AMOUNT_MUST_MATCH_ORDER_TOTAL", 422);
        }

        const hasActiveIyzico = order.payments.some((payment) =>
            payment.provider === "IYZICO"
            && payment.method === "IYZICO"
            && isIyzicoProcessingSessionActive(payment),
        );
        if (hasActiveIyzico && !input.confirmActiveIyzico) {
            throw new ManualPaymentError("ACTIVE_IYZICO_CONFIRMATION_REQUIRED", 409);
        }

        const reusableBankTransfer = input.method === "BANK_TRANSFER"
            ? order.payments.find((payment) =>
                payment.provider === "MANUAL"
                && payment.method === "BANK_TRANSFER"
                && payment.status !== "SUCCESS",
            )
            : undefined;

        const payment = reusableBankTransfer
            ? await tx.payment.update({
                where: { id: reusableBankTransfer.id },
                data: {
                    amount: order.total,
                    currencyCode: order.currencyCode,
                    manualNote: note || null,
                    manualReference: reference || null,
                    settledByUserId: input.adminUserId,
                    paidAt: input.paidAt,
                },
            })
            : await tx.payment.create({
                data: {
                    orderId: order.id,
                    provider: "MANUAL",
                    method: input.method,
                    status: "PENDING",
                    amount: order.total,
                    currencyCode: order.currencyCode,
                    manualNote: note || null,
                    manualReference: reference || null,
                    settledByUserId: input.adminUserId,
                    paidAt: input.paidAt,
                },
            });

        await markPaymentSuccessful(payment.id, tx);
        return payment.id;
    }, { isolationLevel: "Serializable" });

    await completeSuccessfulPayment(paymentId);
    return { paymentId };
}
