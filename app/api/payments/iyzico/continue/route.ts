import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import {
    getSafeIyzicoPaymentPageUrl,
    isIyzicoProcessingSessionActive,
    reconcileInactiveIyzicoSession,
} from "@@/lib/payments/iyzico-session";

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: unknown = await req.json().catch(() => null);
    const orderId = body && typeof body === "object" && "orderId" in body
        ? (body as { orderId?: unknown }).orderId
        : undefined;
    if (typeof orderId !== "string" || !orderId.trim()) {
        return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            userId: true,
            orderNumber: true,
            status: true,
            paymentMethod: true,
            payments: {
                where: { provider: "IYZICO", method: "IYZICO" },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!order) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    if (order.userId !== session.user.id) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (order.paymentMethod !== "IYZICO") {
        return NextResponse.json({ error: "INVALID_PAYMENT_METHOD" }, { status: 409 });
    }
    if (order.status === "PAID" || order.payments.some((payment) => payment.status === "SUCCESS")) {
        return NextResponse.json({ error: "ORDER_ALREADY_PAID" }, { status: 409 });
    }
    if (order.status !== "PENDING") {
        return NextResponse.json({ error: "INVALID_ORDER_STATUS" }, { status: 409 });
    }

    const payment = order.payments[0];
    if (
        !payment
        || payment.provider !== "IYZICO"
        || payment.method !== "IYZICO"
        || payment.status !== "PROCESSING"
        || payment.paymentId !== null
        || payment.paidAt !== null
    ) {
        return NextResponse.json({ error: "PAYMENT_SESSION_NOT_CONTINUABLE" }, { status: 409 });
    }

    if (!isIyzicoProcessingSessionActive(payment)) {
        const outcome = await reconcileInactiveIyzicoSession({
            ...payment,
            order: { id: order.id, orderNumber: order.orderNumber },
        });
        return NextResponse.json(
            { error: outcome === "success" ? "ORDER_ALREADY_PAID" : "PAYMENT_SESSION_EXPIRED" },
            { status: 409 },
        );
    }

    const paymentPageUrl = getSafeIyzicoPaymentPageUrl(payment.paymentPageUrl, payment.token);
    if (!paymentPageUrl) {
        return NextResponse.json({ error: "PAYMENT_SESSION_NOT_CONTINUABLE" }, { status: 409 });
    }

    return NextResponse.json({ paymentPageUrl });
}
