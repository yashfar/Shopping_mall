import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { getLocaleFromRequest } from "@@/lib/get-locale";
import { buildCheckoutAgreement } from "@@/lib/checkout-agreements";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.addressId) return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    const paymentMethod = body.paymentMethod ?? "BANK_TRANSFER";
    if (paymentMethod !== "BANK_TRANSFER" && paymentMethod !== "IYZICO") {
      return NextResponse.json({ error: "INVALID_PAYMENT_METHOD" }, { status: 400 });
    }
    const locale = getLocaleFromRequest(req) === "tr" ? "tr" : "en";
    const quote = await prisma.$transaction((tx) => buildCheckoutAgreement(tx, {
      userId: session.user.id,
      addressId: body.addressId,
      couponCode: body.couponCode,
      locale,
      paymentMethod,
    }));

    return NextResponse.json({
      bundleHash: quote.agreement.bundleHash,
      templateVersion: quote.agreement.templateVersion,
      locale,
      totals: { ...quote.totals, discountAmount: quote.discountAmount, total: quote.total },
      documents: {
        preContract: quote.agreement.preContractHtml,
        distanceSales: quote.agreement.distanceSalesHtml,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "ADDRESS_NOT_FOUND" ? 403 : 400;
    return NextResponse.json({ error: message || "Unable to generate agreement documents" }, { status });
  }
}
