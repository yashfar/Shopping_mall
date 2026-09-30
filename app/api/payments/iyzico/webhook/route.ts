import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    IyzicoIntegrityError,
    IyzicoRetrieveError,
    retrieveAndReconcileIyzicoPayment,
} from "@@/lib/payments/iyzico-payment-result";
import {
    completeSuccessfulIyzicoPayment,
    PaymentCompletionError,
} from "@@/lib/payments/payment-completion";

const SIGNATURE_HEADER = "x-iyz-signature-v3";
const MAX_BODY_LENGTH = 64 * 1024;

type HppWebhookPayload = {
    iyziEventType: string;
    iyziPaymentId: string;
    token: string;
    paymentConversationId: string;
    status: string;
};

function readString(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
    return null;
}

function parseHppPayload(rawBody: string): HppWebhookPayload | null {
    let value: unknown;
    try {
        value = JSON.parse(rawBody);
    } catch {
        return null;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;

    const payload = value as Record<string, unknown>;
    const iyziEventType = readString(payload.iyziEventType);
    const iyziPaymentId = readString(payload.iyziPaymentId);
    const token = readString(payload.token);
    const paymentConversationId = readString(payload.paymentConversationId);
    const status = readString(payload.status);
    if (!iyziEventType || !iyziPaymentId || !token || !paymentConversationId || !status) return null;

    return { iyziEventType, iyziPaymentId, token, paymentConversationId, status };
}

function verifySignature(payload: HppWebhookPayload, receivedSignature: string, secretKey: string): boolean {
    const message = secretKey
        + payload.iyziEventType
        + payload.iyziPaymentId
        + payload.token
        + payload.paymentConversationId
        + payload.status;
    const expectedSignature = createHmac("sha256", secretKey).update(message).digest("hex");
    const normalizedSignature = receivedSignature.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(normalizedSignature)) return false;
    return timingSafeEqual(Buffer.from(expectedSignature, "hex"), Buffer.from(normalizedSignature, "hex"));
}

export async function POST(req: Request) {
    const rawBody = await req.text().catch(() => "");
    if (!rawBody || rawBody.length > MAX_BODY_LENGTH) {
        return NextResponse.json({ received: false }, { status: 400 });
    }

    const payload = parseHppPayload(rawBody);
    if (!payload) return NextResponse.json({ received: false }, { status: 400 });

    const signature = req.headers.get(SIGNATURE_HEADER);
    if (!signature) return NextResponse.json({ received: false }, { status: 401 });

    const secretKey = process.env.IYZICO_SECRET_KEY?.trim();
    if (!secretKey) {
        console.error("Iyzico webhook secret is not configured");
        return NextResponse.json({ received: false }, { status: 503 });
    }
    if (!verifySignature(payload, signature, secretKey)) {
        return NextResponse.json({ received: false }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
        where: {
            provider: "IYZICO",
            method: "IYZICO",
            token: payload.token,
            conversationId: payload.paymentConversationId,
        },
        include: { order: { select: { id: true, orderNumber: true } } },
        take: 2,
    }).catch(() => null);
    if (!payments) return NextResponse.json({ received: false }, { status: 503 });
    if (payments.length !== 1) return NextResponse.json({ received: false }, { status: 404 });

    const payment = payments[0];
    if (payment.paymentId && payment.paymentId !== payload.iyziPaymentId) {
        return NextResponse.json({ received: false }, { status: 409 });
    }

    try {
        const outcome = await retrieveAndReconcileIyzicoPayment(payment, payload.iyziPaymentId);
        if (outcome === "success") {
            await completeSuccessfulIyzicoPayment(payment.id);
        }
        return NextResponse.json({ received: true, outcome }, { status: 200 });
    } catch (error) {
        if (error instanceof IyzicoRetrieveError) {
            console.error("Iyzico webhook retrieve failed", { paymentId: payment.id, orderId: payment.order.id });
            return NextResponse.json({ received: false }, { status: 503 });
        }
        if (error instanceof IyzicoIntegrityError) {
            console.error("Iyzico webhook integrity validation failed", { paymentId: payment.id, orderId: payment.order.id });
            return NextResponse.json({ received: false }, { status: 409 });
        }
        if (error instanceof PaymentCompletionError) {
            console.error("Iyzico webhook completion failed", {
                paymentId: payment.id,
                orderId: payment.order.id,
                code: error.code,
            });
            return NextResponse.json({ received: false }, { status: 503 });
        }
        console.error("Iyzico webhook reconciliation failed", { paymentId: payment.id, orderId: payment.order.id });
        return NextResponse.json({ received: false }, { status: 500 });
    }
}
