import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

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
        const { status } = body;

        // Validate status
        const validStatuses = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELED"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
                { status: 400 }
            );
        }

        // Update order status
        const order = await prisma.order.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ order, message: "Order status updated successfully" });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json(
            { error: "Failed to update order status" },
            { status: 500 }
        );
    }
}
