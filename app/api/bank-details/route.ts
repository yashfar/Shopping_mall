import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { getPaymentConfig } from "@/lib/payment-config";

/**
 * GET /api/bank-details?currency=TRY|USD
 * Returns bank transfer details for authenticated users.
 * Defaults to TRY if no currency param is provided.
 */
export async function GET(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const currency = searchParams.get("currency") === "USD" ? "USD" : "TRY";

        const config = await getPaymentConfig();

        if (currency === "USD") {
            const available = !!(config.usdBankName && config.usdIban);
            return NextResponse.json({
                available,
                bankName: config.usdBankName,
                accountHolder: config.usdAccountHolder,
                iban: config.usdIban,
                swiftCode: config.usdSwiftCode,
                bankTransferNote: config.usdBankTransferNote,
            });
        }

        return NextResponse.json({
            available: !!(config.bankName || config.iban),
            bankName: config.bankName,
            accountHolder: config.accountHolder,
            iban: config.iban,
            swiftCode: null,
            bankTransferNote: config.bankTransferNote,
        });
    } catch (error) {
        console.error("Error fetching bank details:", error);
        return NextResponse.json(
            { error: "Failed to fetch bank details" },
            { status: 500 }
        );
    }
}
