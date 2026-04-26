import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { sendReturnPendingEmail } from "@@/lib/mail";
import { getLocaleFromRequest } from "@@/lib/get-locale";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const locale = getLocaleFromRequest(req);

    try {
        const { reason, note, photos } = await req.json();

        if (!reason) {
            return NextResponse.json({ error: "Reason is required" }, { status: 400 });
        }

        const validReasons = ["DAMAGED", "WRONG_ITEM", "NOT_AS_DESCRIBED", "CHANGED_MIND", "OTHER"];
        if (!validReasons.includes(reason)) {
            return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                returnRequest: true,
                user: { select: { email: true, firstName: true } },
            },
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

        const photoUrls: string[] = Array.isArray(photos)
            ? photos.filter((p: unknown) => typeof p === "string").slice(0, 5)
            : [];

        if (photoUrls.length === 0) {
            return NextResponse.json(
                { error: "At least one photo is required for a return request" },
                { status: 400 }
            );
        }

        const returnRequest = await prisma.$transaction(async (tx) => {
            // Keep user locale up to date
            await tx.user.update({ where: { id: session.user.id }, data: { locale } });

            const rr = await tx.returnRequest.create({
                data: {
                    orderId: id,
                    userId: session.user.id,
                    reason,
                    note: note?.trim() || null,
                    photos: photoUrls,
                    previousStatus: order.status,
                },
            });

            await tx.order.update({
                where: { id },
                data: { status: "RETURN_REQUESTED" },
            });

            return rr;
        });

        // Send pending notification email (non-blocking)
        try {
            await sendReturnPendingEmail(order.user.email, {
                orderNumber: order.orderNumber || id.substring(0, 8),
                firstName: order.user.firstName,
                locale,
            });
        } catch (emailErr) {
            console.error("Failed to send return pending email:", emailErr);
        }

        return NextResponse.json({ returnRequest }, { status: 201 });
    } catch (error) {
        console.error("Error creating return request:", error);
        return NextResponse.json(
            { error: "Failed to create return request" },
            { status: 500 }
        );
    }
}
