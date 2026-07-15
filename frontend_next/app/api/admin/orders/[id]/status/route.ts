import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { sendOrderShippedEmail } from "@@/lib/mail";

/**
 * PATCH /api/admin/orders/[id]/status
 * Updates order status (admin only)
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { status, trackingNumber, shippingCompany, trackingUrl } = body;

        // Validate status
        const validStatuses = ["PENDING", "PAYMENT_UPLOADED", "PAYMENT_REJECTED", "PAID", "SHIPPED", "COMPLETED", "CANCELED"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
                { status: 400 }
            );
        }

        // Tracking number is required when marking as SHIPPED
        if (status === "SHIPPED" && !trackingNumber?.trim()) {
            return NextResponse.json(
                { error: "Kargo durumu için takip numarası zorunludur." },
                { status: 400 }
            );
        }

        // Update order status, tracking number, shipping company and tracking URL
        const updateData: any = { status };
        if (trackingNumber !== undefined) {
            updateData.trackingNumber = trackingNumber.trim() || null;
        }
        if (shippingCompany !== undefined) {
            updateData.shippingCompany = shippingCompany.trim() || null;
        }
        if (trackingUrl !== undefined) {
            updateData.trackingUrl = trackingUrl.trim() || null;
        }

        const order = await prisma.order.update({
            where: { id },
            data: updateData,
        });

        // Send shipped notification email
        if (status === "SHIPPED") {
            (async () => {
                try {
                    const fullOrder = await prisma.order.findUnique({
                        where: { id },
                        include: {
                            user: { select: { email: true, firstName: true, locale: true } },
                        },
                    });

                    if (fullOrder?.user) {
                        const userLocale = (fullOrder.user.locale === "tr" ? "tr" : "en") as "tr" | "en";
                        await sendOrderShippedEmail(fullOrder.user.email, {
                            orderNumber: fullOrder.orderNumber || id.substring(0, 8),
                            firstName: fullOrder.user.firstName,
                            trackingNumber: fullOrder.trackingNumber,
                            shippingCompany: fullOrder.shippingCompany,
                            trackingUrl: fullOrder.trackingUrl,
                            locale: userLocale,
                        });
                    }
                } catch (emailErr) {
                    console.error("Failed to send shipped email:", emailErr);
                }
            })();
        }

        return NextResponse.json({ order, message: "Order status updated successfully" });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json(
            { error: "Failed to update order status" },
            { status: 500 }
        );
    }
}
