import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { sendReturnPendingEmail } from "@@/lib/mail";
import { getLocaleFromRequest } from "@@/lib/get-locale";
import { canReopenReturn, customerOwnsOrder, validateReturnSubmission } from "@@/lib/return-workflow";

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
        const { type = "ISSUE", reason, note, photos, followUp } = await req.json();
        if (!["WITHDRAWAL", "ISSUE"].includes(type)) return NextResponse.json({ error: "Invalid request type" }, { status: 400 });

        const validReasons = ["DAMAGED", "WRONG_ITEM", "NOT_AS_DESCRIBED", "CHANGED_MIND", "OTHER"];
        if (reason && !validReasons.includes(reason)) {
            return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
        }
        const validation = validateReturnSubmission({ type, reason, photos });
        if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });

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

        if (!customerOwnsOrder(order.userId, session.user.id)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const allowedStatuses = ["PAID", "SHIPPED", "COMPLETED", "DELIVERED"];
        if (!allowedStatuses.includes(order.status)) {
            return NextResponse.json(
                { error: "Return request can only be made for paid/shipped/completed orders" },
                { status: 400 }
            );
        }

        if (order.returnRequest && !canReopenReturn(order.returnRequest.status)) {
            return NextResponse.json(
                { error: "A return request already exists for this order" },
                { status: 409 }
            );
        }

        const photoUrls = validation.photos;
        if (order.returnRequest && !String(followUp || note || "").trim()) {
            return NextResponse.json({ error: "A follow-up message is required to reopen this request" }, { status: 400 });
        }

        const returnRequest = await prisma.$transaction(async (tx) => {
            // Keep user locale up to date
            await tx.user.update({ where: { id: session.user.id }, data: { locale } });

            const rr = order.returnRequest
                ? await tx.returnRequest.update({
                    where: { id: order.returnRequest.id },
                    data: {
                        status: "PENDING", type, reason: reason || null,
                        note: note?.trim() || order.returnRequest.note,
                        photos: photoUrls.length ? photoUrls : order.returnRequest.photos,
                        customerExplanation: null,
                        events: { create: { actor: "CUSTOMER", action: "REOPENED", message: String(followUp || note).trim() } },
                    },
                })
                : await tx.returnRequest.create({
                    data: {
                        orderId: id, userId: session.user.id, type, reason: reason || null,
                        note: note?.trim() || null, photos: photoUrls, previousStatus: order.status,
                        events: { create: { actor: "CUSTOMER", action: "SUBMITTED", message: note?.trim() || null } },
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
