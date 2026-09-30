import "server-only";

import {
    IyzicoIntegrityError,
    IyzicoRetrieveError,
    retrieveAndReconcileIyzicoPayment,
    type IyzicoPaymentContext,
} from "@@/lib/payments/iyzico-payment-result";
import {
    completeSuccessfulIyzicoPayment,
    PaymentCompletionError,
} from "@@/lib/payments/payment-completion";

export const IYZICO_CHECKOUT_FORM_SESSION_LIFETIME_MS = 30 * 60 * 1000;

const IYZICO_CHECKOUT_FORM_HOSTS = new Set([
    "cpp.iyzipay.com",
    "sandbox-cpp.iyzipay.com",
]);

export function getSafeIyzicoPaymentPageUrl(
    value: string | null,
    expectedToken: string | null,
): string | null {
    if (!value || !expectedToken) return null;
    try {
        const url = new URL(value);
        if (
            url.protocol !== "https:"
            || url.port
            || url.username
            || url.password
            || !IYZICO_CHECKOUT_FORM_HOSTS.has(url.hostname.toLowerCase())
            || url.pathname !== "/"
            || url.searchParams.get("token") !== expectedToken
        ) {
            return null;
        }
        return url.toString();
    } catch {
        return null;
    }
}

export type IyzicoSessionPayment = IyzicoPaymentContext & {
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export type IyzicoSessionOutcome = "active" | "success" | "failed" | "unavailable";

export function isIyzicoProcessingSessionActive(
    payment: Pick<IyzicoSessionPayment, "status" | "paymentId" | "paidAt" | "createdAt" | "updatedAt">,
    now = new Date(),
): boolean {
    const latestActivityAt = Math.max(payment.createdAt.getTime(), payment.updatedAt.getTime());
    return payment.status === "PROCESSING"
        && payment.paymentId === null
        && payment.paidAt === null
        && now.getTime() - latestActivityAt < IYZICO_CHECKOUT_FORM_SESSION_LIFETIME_MS;
}

export async function reconcileInactiveIyzicoSession(
    payment: IyzicoSessionPayment,
): Promise<IyzicoSessionOutcome> {
    if (payment.status === "SUCCESS") return "success";
    if (payment.status !== "PROCESSING") return payment.status === "FAILED" ? "failed" : "unavailable";
    if (isIyzicoProcessingSessionActive(payment)) return "active";

    try {
        const outcome = await retrieveAndReconcileIyzicoPayment(payment);
        if (outcome === "success") {
            try {
                await completeSuccessfulIyzicoPayment(payment.id);
            } catch (error) {
                console.error("Iyzico stale-session completion failed", {
                    paymentId: payment.id,
                    orderId: payment.order.id,
                    code: error instanceof PaymentCompletionError ? error.code : "UNKNOWN",
                });
            }
            return "success";
        }
        return outcome === "processing" ? "active" : outcome;
    } catch (error) {
        if (error instanceof IyzicoRetrieveError) return "unavailable";
        if (error instanceof IyzicoIntegrityError) {
            console.error("Iyzico stale-session integrity validation failed", {
                paymentId: payment.id,
                orderId: payment.order.id,
            });
            return "unavailable";
        }
        throw error;
    }
}

