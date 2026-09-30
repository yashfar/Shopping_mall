import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { PaymentCompletionError } from "@@/lib/payments/payment-completion";
import { ManualPaymentError, settleOrderManually } from "@@/lib/payments/manual-settlement";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body: unknown = await req.json().catch(() => null);
        if (!body || typeof body !== "object") {
            throw new ManualPaymentError("INVALID_REQUEST", 400);
        }

        const input = body as Record<string, unknown>;
        const method = input.method;
        const amount = input.amount;
        const note = typeof input.note === "string" ? input.note.trim() : "";
        const reference = typeof input.reference === "string" ? input.reference.trim() : "";
        const confirmActiveIyzico = input.confirmActiveIyzico === true;
        const paidAt = typeof input.paidAt === "string" ? new Date(input.paidAt) : new Date();

        if (method !== "BANK_TRANSFER" && method !== "CASH") {
            throw new ManualPaymentError("INVALID_PAYMENT_METHOD", 400);
        }
        await settleOrderManually({
            orderId: id,
            adminUserId: session.user.id,
            method,
            amount: amount as number,
            paidAt,
            note,
            reference,
            confirmActiveIyzico,
        });
        return NextResponse.json({ message: "ORDER_MARKED_PAID_MANUALLY" });
    } catch (error) {
        if (error instanceof ManualPaymentError) {
            return NextResponse.json({ error: error.code }, { status: error.status });
        }
        if (error instanceof PaymentCompletionError) {
            return NextResponse.json({ error: error.code }, { status: 409 });
        }
        if (typeof error === "object" && error !== null && "code" in error
            && (error as { code?: unknown }).code === "P2034") {
            return NextResponse.json({ error: "PAYMENT_CONFLICT" }, { status: 409 });
        }
        console.error("Manual payment settlement failed", {
            name: error instanceof Error ? error.name : "UnknownError",
        });
        return NextResponse.json({ error: "MANUAL_PAYMENT_FAILED" }, { status: 500 });
    }
}
