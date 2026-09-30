import "server-only";

import type {
    CheckoutFormRetrieveRequest,
    CheckoutFormRetrieveResponse,
} from "iyzipay";
import type { PaymentStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getIyzicoClient } from "@@/lib/payments/iyzico";
import {
    markPaymentFailed,
    markPaymentProcessing,
    markPaymentSuccessful,
} from "@@/lib/payment-service";

type TransactionClient = Prisma.TransactionClient;

export type IyzicoPaymentContext = {
    id: string;
    status: PaymentStatus;
    token: string | null;
    conversationId: string | null;
    paymentId: string | null;
    amount: number;
    currencyCode: string;
    order: {
        id: string;
        orderNumber: string | null;
    };
};

export type IyzicoPaymentOutcome = "success" | "failed" | "processing";

export class IyzicoRetrieveError extends Error {}
export class IyzicoIntegrityError extends Error {}

function retrieveCheckoutForm(
    request: CheckoutFormRetrieveRequest,
): Promise<CheckoutFormRetrieveResponse> {
    const client = getIyzicoClient();
    return new Promise((resolve, reject) => {
        client.checkoutForm.retrieve(request, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
}

function decimalToMinorUnits(value: string | number | undefined): number | null {
    if (value === undefined) return null;
    const normalized = String(value).trim();
    const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized);
    if (!match) return null;

    const fraction = match[2] ?? "";
    if (fraction.length > 2 && !/^0+$/.test(fraction.slice(2))) return null;
    const minor = BigInt(match[1]) * BigInt(100)
        + BigInt((fraction.slice(0, 2) + "00").slice(0, 2));
    return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
}

function safeFailureValue(value: string | undefined, fallback: string): string {
    return (value?.trim() || fallback).slice(0, 500);
}

async function storePaymentId(
    tx: TransactionClient,
    localPaymentId: string,
    iyzicoPaymentId: string | undefined,
) {
    if (!iyzicoPaymentId?.trim()) return;
    const payment = await tx.payment.findUnique({
        where: { id: localPaymentId },
        select: { paymentId: true },
    });
    if (!payment) throw new IyzicoIntegrityError("Local payment not found");
    if (payment.paymentId && payment.paymentId !== iyzicoPaymentId) {
        throw new IyzicoIntegrityError("Conflicting iyzico payment identifier");
    }
    if (!payment.paymentId) {
        await tx.payment.update({
            where: { id: localPaymentId },
            data: { paymentId: iyzicoPaymentId },
        });
    }
}

export async function retrieveAndReconcileIyzicoPayment(
    payment: IyzicoPaymentContext,
    expectedIyzicoPaymentId?: string,
): Promise<IyzicoPaymentOutcome> {
    if (!payment.token || !payment.conversationId) {
        throw new IyzicoIntegrityError("Payment is missing iyzico identifiers");
    }

    let result: CheckoutFormRetrieveResponse;
    try {
        result = await retrieveCheckoutForm({
            locale: "tr",
            conversationId: payment.conversationId,
            token: payment.token,
        });
    } catch {
        throw new IyzicoRetrieveError("Iyzico retrieve request failed");
    }

    const retrievedPaymentId = result.paymentId?.trim();
    if (expectedIyzicoPaymentId && retrievedPaymentId && retrievedPaymentId !== expectedIyzicoPaymentId) {
        throw new IyzicoIntegrityError("Webhook and retrieve payment identifiers did not match");
    }

    if (result.status !== "success") {
        const transition = await prisma.$transaction(async (tx) => {
            await storePaymentId(tx, payment.id, result.paymentId);
            return markPaymentFailed(payment.id, {
                failureCode: safeFailureValue(result.errorCode, "IYZICO_RETRIEVE_FAILED"),
                failureMessage: safeFailureValue(result.errorMessage, "Iyzico payment failed"),
            }, tx);
        });
        return transition.payment.status === "SUCCESS" ? "success" : "failed";
    }

    const expectedBasketId = payment.order.orderNumber || payment.order.id;
    const retrievedPrice = decimalToMinorUnits(result.price);
    const retrievedPaidPrice = decimalToMinorUnits(result.paidPrice);
    const integrityValid = result.token === payment.token
        && result.conversationId === payment.conversationId
        && result.basketId === expectedBasketId
        && result.currency === payment.currencyCode
        && retrievedPrice === payment.amount
        && retrievedPaidPrice === payment.amount
        && (!expectedIyzicoPaymentId || retrievedPaymentId === expectedIyzicoPaymentId);

    if (!integrityValid) {
        throw new IyzicoIntegrityError("Iyzico retrieve response did not match local payment");
    }

    if (result.paymentStatus === "SUCCESS" && result.fraudStatus === 1) {
        if (!retrievedPaymentId) throw new IyzicoIntegrityError("Missing iyzico payment identifier");
        await prisma.$transaction(async (tx) => {
            await storePaymentId(tx, payment.id, retrievedPaymentId);
            await markPaymentSuccessful(payment.id, tx);
        });
        return "success";
    }

    if (result.paymentStatus === "SUCCESS" && result.fraudStatus !== -1) {
        if (!retrievedPaymentId) throw new IyzicoIntegrityError("Missing iyzico payment identifier");
        await prisma.$transaction(async (tx) => {
            await storePaymentId(tx, payment.id, retrievedPaymentId);
            await markPaymentProcessing(payment.id, tx);
        });
        return "processing";
    }

    const transition = await prisma.$transaction(async (tx) => {
        await storePaymentId(tx, payment.id, retrievedPaymentId);
        return markPaymentFailed(payment.id, {
            failureCode: safeFailureValue(result.errorCode, "IYZICO_PAYMENT_FAILED"),
            failureMessage: safeFailureValue(result.errorMessage, "Iyzico payment was not approved"),
        }, tx);
    });
    return transition.payment.status === "SUCCESS" ? "success" : "failed";
}
