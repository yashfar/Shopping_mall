
import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { getPaymentConfig, updatePaymentConfig } from "@/lib/payment-config";

/**
 * GET /api/admin/payment-config
 * Returns the current payment configuration.
 * Protected: ADMIN only.
 */
export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const config = await getPaymentConfig();
        return NextResponse.json({ config });
    } catch (error) {
        console.error("Error fetching payment config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/admin/payment-config
 * Updates the payment configuration.
 * Protected: ADMIN only.
 */
export async function POST(request: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await request.json();
        console.log("Updating Payment Config:", body);
        const { taxPercent, shippingFee, freeShippingThreshold } = body;

        // Validation
        if (typeof taxPercent !== "number" || typeof shippingFee !== "number" || typeof freeShippingThreshold !== "number") {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        // We assume input is in correct units (Shipping/Threshold in cents, Tax in %)
        const updated = await updatePaymentConfig({
            taxPercent,
            shippingFee,
            freeShippingThreshold
        });

        return NextResponse.json({ config: updated });
    } catch (error) {
        console.error("Error updating payment config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
