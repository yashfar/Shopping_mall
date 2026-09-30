import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import {
    getSafeIyzicoPaymentPageUrl,
    isIyzicoProcessingSessionActive,
    reconcileInactiveIyzicoSession,
} from "@@/lib/payments/iyzico-session";

/**
 * GET /api/orders/[id]
 * Returns order details for the logged-in user
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            omit: { identityNumber: true },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                thumbnail: true,
                            },
                        },
                    },
                },
                returnRequest: {
                    select: {
                        id: true, type: true, reason: true, note: true, photos: true,
                        status: true, customerExplanation: true, receiptStatus: true,
                        inspectionStatus: true, refundStatus: true, createdAt: true, updatedAt: true,
                        events: { select: { id: true, actor: true, action: true, message: true, createdAt: true }, orderBy: { createdAt: "asc" } },
                    },
                },
                agreementSnapshots: {
                    select: { documentType: true, templateVersion: true, locale: true, acceptedAt: true, integrityHash: true, deliveryStatus: true, deliveryAttempts: true },
                    orderBy: { documentType: "asc" },
                },
                payments: {
                    where: { provider: "IYZICO", method: "IYZICO" },
                    select: {
                        id: true,
                        status: true,
                        token: true,
                        conversationId: true,
                        paymentId: true,
                        paidAt: true,
                        amount: true,
                        currencyCode: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Verify order belongs to user
        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { payments, ...safeOrder } = order;
        if (order.paymentMethod === "IYZICO" && order.status === "PENDING") {
            for (const payment of payments) {
                if (payment.status !== "PROCESSING" || isIyzicoProcessingSessionActive(payment)) continue;
                await reconcileInactiveIyzicoSession({
                    ...payment,
                    order: { id: order.id, orderNumber: order.orderNumber },
                });
            }
        }

        const refreshedState = await prisma.order.findUnique({
            where: { id: order.id },
            select: {
                status: true,
                payments: {
                    where: { provider: "IYZICO", method: "IYZICO" },
                    select: {
                        status: true,
                        token: true,
                        paymentPageUrl: true,
                        paymentId: true,
                        paidAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        const paymentStates = refreshedState?.payments ?? [];
        const currentOrderStatus = refreshedState?.status ?? order.status;
        const hasSuccessfulPayment = paymentStates.some((payment) => payment.status === "SUCCESS");
        const hasActivePayment = paymentStates.some((payment) =>
            payment.status === "PENDING" || payment.status === "PROCESSING"
        );
        const latestPayment = paymentStates[0];
        const latestSessionIsActive = latestPayment
            ? isIyzicoProcessingSessionActive(latestPayment)
            : false;
        const canContinuePayment = order.paymentMethod === "IYZICO"
            && currentOrderStatus === "PENDING"
            && latestPayment?.status === "PROCESSING"
            && latestSessionIsActive
            && getSafeIyzicoPaymentPageUrl(
                latestPayment.paymentPageUrl,
                latestPayment.token,
            ) !== null;
        return NextResponse.json({
            order: {
                ...safeOrder,
                status: currentOrderStatus,
                paymentStatus: paymentStates[0]?.status ?? null,
                paymentSessionActive: hasActivePayment,
                canContinuePayment,
                canRetryPayment: order.paymentMethod === "IYZICO"
                    && currentOrderStatus === "PENDING"
                    && !hasSuccessfulPayment
                    && !hasActivePayment,
            },
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
}
