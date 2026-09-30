
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
        const {
            taxPercent, shippingFee, freeShippingThreshold,
            bankName, accountHolder, iban, bankTransferNote,
            usdBankName, usdAccountHolder, usdIban, usdSwiftCode, usdBankTransferNote,
            usdShippingFee, usdFreeShippingThreshold,
        } = body;

        // Validation
        if (typeof taxPercent !== "number" || typeof shippingFee !== "number" || typeof freeShippingThreshold !== "number") {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const updated = await updatePaymentConfig({
            taxPercent,
            shippingFee,
            freeShippingThreshold,
            ...(typeof bankName === "string" ? { bankName } : {}),
            ...(typeof accountHolder === "string" ? { accountHolder } : {}),
            ...(typeof iban === "string" ? { iban } : {}),
            ...(typeof bankTransferNote === "string" ? { bankTransferNote } : {}),
            ...(typeof usdBankName === "string" ? { usdBankName } : {}),
            ...(typeof usdAccountHolder === "string" ? { usdAccountHolder } : {}),
            ...(typeof usdIban === "string" ? { usdIban } : {}),
            ...(typeof usdSwiftCode === "string" ? { usdSwiftCode } : {}),
            ...(typeof usdBankTransferNote === "string" ? { usdBankTransferNote } : {}),
            ...(typeof usdShippingFee === "number" ? { usdShippingFee } : {}),
            ...(typeof usdFreeShippingThreshold === "number" ? { usdFreeShippingThreshold } : {}),
        });

        return NextResponse.json({ config: updated });
    } catch (error) {
        console.error("Error updating payment config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
