import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const { reason, note } = await req.json();

        if (!reason) {
            return NextResponse.json({ error: "Reason is required" }, { status: 400 });
        }

        const validReasons = ["DAMAGED", "WRONG_ITEM", "NOT_AS_DESCRIBED", "CHANGED_MIND", "OTHER"];
        if (!validReasons.includes(reason)) {
            return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { returnRequest: true },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const allowedStatuses = ["PAID", "SHIPPED", "COMPLETED", "DELIVERED"];
        if (!allowedStatuses.includes(order.status)) {
            return NextResponse.json(
                { error: "Return request can only be made for paid/shipped/completed orders" },
                { status: 400 }
            );
        }

        if (order.returnRequest) {
            return NextResponse.json(
                { error: "A return request already exists for this order" },
                { status: 409 }
            );
        }

        const returnRequest = await prisma.$transaction(async (tx) => {
            const rr = await tx.returnRequest.create({
                data: {
                    orderId: id,
                    userId: session.user.id,
                    reason,
                    note: note?.trim() || null,
                    previousStatus: order.status,
                },
            });

            await tx.order.update({
                where: { id },
                data: { status: "RETURN_REQUESTED" },
            });

            return rr;
        });

        return NextResponse.json({ returnRequest }, { status: 201 });
    } catch (error) {
        console.error("Error creating return request:", error);
        return NextResponse.json(
            { error: "Failed to create return request" },
            { status: 500 }
        );
    }
}
