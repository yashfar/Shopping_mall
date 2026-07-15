import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { getPaymentConfig } from "@/lib/payment-config";

/**
 * GET /api/bank-details
 * Returns bank transfer details for authenticated users.
 */
export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const config = await getPaymentConfig();

        return NextResponse.json({
            bankName: config.bankName,
            accountHolder: config.accountHolder,
            iban: config.iban,
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
