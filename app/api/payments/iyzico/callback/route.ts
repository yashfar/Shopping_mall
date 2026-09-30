import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    retrieveAndReconcileIyzicoPayment,
    type IyzicoPaymentOutcome,
} from "@@/lib/payments/iyzico-payment-result";
import {
    completeSuccessfulIyzicoPayment,
    PaymentCompletionError,
} from "@@/lib/payments/payment-completion";

function redirect(req: Request, path: string) {
    const configuredBaseUrl = process.env.NEXT_PUBLIC_URL?.trim();
    const baseUrl = configuredBaseUrl || new URL(req.url).origin;
    return NextResponse.redirect(new URL(path, baseUrl), 303);
}

function orderRedirect(req: Request, orderId: string, outcome: IyzicoPaymentOutcome) {
    if (outcome === "success" || outcome === "processing") {
        return redirect(req, `/checkout/success?orderId=${encodeURIComponent(orderId)}`);
    }
    return redirect(req, `/checkout?orderId=${encodeURIComponent(orderId)}`);
}

export async function POST(req: Request) {
    let token: string;
    try {
        const formData = await req.formData();
        const submittedToken = formData.get("token");
        if (typeof submittedToken !== "string" || !submittedToken.trim()) {
            return redirect(req, "/orders");
        }
        token = submittedToken.trim();
    } catch {
        return redirect(req, "/orders");
    }

    const payments = await prisma.payment.findMany({
        where: { token, provider: "IYZICO", method: "IYZICO" },
        include: { order: { select: { id: true, orderNumber: true } } },
        take: 2,
    }).catch(() => null);
    if (!payments || payments.length !== 1) return redirect(req, "/orders");

    const payment = payments[0];
    let outcome: IyzicoPaymentOutcome;
    try {
        outcome = await retrieveAndReconcileIyzicoPayment(payment);
    } catch {
        console.error("Iyzico callback reconciliation failed");
        return orderRedirect(req, payment.order.id, payment.status === "SUCCESS" ? "success" : "failed");
    }

    if (outcome === "success") {
        try {
            await completeSuccessfulIyzicoPayment(payment.id);
        } catch (error) {
            console.error("Iyzico callback completion failed", {
                paymentId: payment.id,
                orderId: payment.order.id,
                code: error instanceof PaymentCompletionError ? error.code : "UNKNOWN",
            });
        }
    }
    return orderRedirect(req, payment.order.id, outcome);
}
