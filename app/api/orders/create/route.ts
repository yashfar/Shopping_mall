import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@@/lib/order-utils";
import { getLocaleFromRequest } from "@@/lib/get-locale";
import { buildCheckoutAgreement, validateAgreementAcceptance } from "@@/lib/checkout-agreements";
import { deliverOrderAgreements } from "@@/lib/agreement-delivery";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const locale = getLocaleFromRequest(req) === "tr" ? "tr" : "en";

  try {
    const body = await req.json().catch(() => ({}));
    const paymentMethod = body.paymentMethod ?? "BANK_TRANSFER";
    if (paymentMethod !== "BANK_TRANSFER" && paymentMethod !== "IYZICO") {
      return NextResponse.json({ error: "INVALID_PAYMENT_METHOD" }, { status: 400 });
    }
    if (!validateAgreementAcceptance(body)) {
      return NextResponse.json({ error: "DOCUMENT_ACCEPTANCE_REQUIRED" }, { status: 400 });
    }
    if (typeof body.addressId !== "string" || !body.addressId) {
      return NextResponse.json({ error: "DELIVERY_ADDRESS_REQUIRED" }, { status: 400 });
    }
    if (body.identityNumber != null && typeof body.identityNumber !== "string") {
      return NextResponse.json({ error: "INVALID_IDENTITY_NUMBER" }, { status: 400 });
    }
    const identityNumber = typeof body.identityNumber === "string" ? body.identityNumber.trim() : "";
    if ((identityNumber && !/^\d{11}$/.test(identityNumber)) || (paymentMethod === "IYZICO" && !identityNumber)) {
      return NextResponse.json({ error: "INVALID_IDENTITY_NUMBER" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const quote = await buildCheckoutAgreement(tx, {
        userId: session.user.id,
        addressId: body.addressId,
        couponCode: body.couponCode,
        locale,
        paymentMethod,
      });
      if (quote.agreement.bundleHash !== body.acceptedBundleHash) throw new Error("AGREEMENT_CHANGED");

      const acceptedAt = new Date();
      await tx.user.update({ where: { id: session.user.id }, data: { locale } });
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          orderNumber: await generateOrderNumber(tx),
          total: quote.total,
          currencyCode: "TRY",
          status: "PENDING",
          paymentMethod,
          shippingName: quote.buyerName,
          shippingPhone: quote.address.phone,
          shippingAddress: quote.deliveryAddress,
          ...(identityNumber ? { identityNumber } : {}),
          ...(quote.coupon ? { couponId: quote.coupon.id, discountAmount: quote.discountAmount } : {}),
          items: {
            create: quote.cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              variantColor: item.variant?.color ?? null,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
          ...(paymentMethod === "BANK_TRANSFER" ? { payments: {
            create: {
              provider: "MANUAL",
              method: "BANK_TRANSFER",
              status: "PENDING",
              amount: quote.total,
              currencyCode: "TRY",
            },
          }} : {}),
          agreementSnapshots: {
            create: [
              { documentType: "PRE_CONTRACT_INFORMATION", templateVersion: quote.agreement.templateVersion, locale, contentHtml: quote.agreement.preContractHtml, integrityHash: quote.agreement.preContractHash, acceptedAt },
              { documentType: "DISTANCE_SALES_AGREEMENT", templateVersion: quote.agreement.templateVersion, locale, contentHtml: quote.agreement.distanceSalesHtml, integrityHash: quote.agreement.distanceSalesHash, acceptedAt },
            ],
          },
        },
      });

      if (quote.coupon) {
        await tx.couponUsage.create({ data: { couponId: quote.coupon.id, userId: session.user.id, orderId: order.id } });
        await tx.coupon.update({ where: { id: quote.coupon.id }, data: { usedCount: { increment: 1 } } });
      }
      return { orderId: order.id };
    });

    await deliverOrderAgreements(result.orderId).catch(() => undefined);
    return NextResponse.json({ message: "Order created", orderId: result.orderId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "AGREEMENT_CHANGED") return NextResponse.json({ error: message }, { status: 409 });
    const known = ["CART_EMPTY", "ADDRESS_NOT_FOUND", "INVALID_COUPON", "COUPON_EXPIRED", "COUPON_LIMIT_REACHED", "COUPON_ALREADY_USED"];
    if (known.includes(message) || message.startsWith("COUPON_MIN_AMOUNT:") || message.startsWith("PRODUCT_INACTIVE:") || message.startsWith("INSUFFICIENT_STOCK:")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Error creating order");
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
