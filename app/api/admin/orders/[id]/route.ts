import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { isIyzicoProcessingSessionActive } from "@@/lib/payments/iyzico-session";

/**
 * GET /api/admin/orders/[id]
 * Returns full order details (admin only)
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
                paymentMethod: true,
                createdAt: true,
                trackingNumber: true,
                shippingCompany: true,
                trackingUrl: true,
                paymentProofUrl: true,
                discountAmount: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
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
                returnRequest: true,
                payments: {
                    select: {
                        provider: true,
                        method: true,
                        status: true,
                        paymentId: true,
                        paidAt: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Fetch user's primary address (most recent)
        const address = order.user ? await prisma.address.findFirst({
            where: { userId: order.user.id },
            orderBy: { createdAt: "desc" },
        }) : null;

        const hasSuccessfulPayment = order.payments.some((payment) => payment.status === "SUCCESS");
        const hasActiveIyzicoPayment = order.payments.some((payment) =>
            payment.provider === "IYZICO"
            && payment.method === "IYZICO"
            && isIyzicoProcessingSessionActive(payment),
        );
        const safeOrder = Object.fromEntries(
            Object.entries(order).filter(([key]) => key !== "payments"),
        );

        return NextResponse.json({
            order: {
                ...safeOrder,
                canMarkPaidManually: !hasSuccessfulPayment
                    && (order.status === "PENDING" || order.status === "PAYMENT_REJECTED"),
                hasActiveIyzicoPayment,
            },
            address,
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }

}
