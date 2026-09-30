import type { Prisma } from "@/generated/prisma/client";
import { calculateCartTotals } from "@@/lib/payment-utils";
import { generateAgreementBundle, type AgreementLocale } from "@@/lib/order-agreements";

type Db = Prisma.TransactionClient;

export function validateAgreementAcceptance(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const candidate = input as { acceptedDocuments?: unknown; acceptedBundleHash?: unknown };
  return candidate.acceptedDocuments === true
    && typeof candidate.acceptedBundleHash === "string"
    && /^[a-f0-9]{64}$/.test(candidate.acceptedBundleHash);
}

export async function buildCheckoutAgreement(
  db: Db,
  input: { userId: string; addressId: string; couponCode?: string; locale: AgreementLocale; paymentMethod?: "BANK_TRANSFER" | "IYZICO" },
) {
  const [user, address, cart, storedConfig] = await Promise.all([
    db.user.findUnique({ where: { id: input.userId }, select: { email: true, firstName: true, lastName: true, phone: true } }),
    db.address.findFirst({ where: { id: input.addressId, userId: input.userId } }),
    db.cart.findUnique({
      where: { userId: input.userId },
      include: {
        items: {
          include: {
            product: { include: { translations: true } },
            variant: true,
          },
        },
      },
    }),
    db.paymentConfig.findFirst(),
  ]);

  if (!user) throw new Error("USER_NOT_FOUND");
  if (!address) throw new Error("ADDRESS_NOT_FOUND");
  if (!cart?.items.length) throw new Error("CART_EMPTY");

  for (const item of cart.items) {
    if (!item.product.isActive) throw new Error(`PRODUCT_INACTIVE:${item.product.title}`);
    const available = item.variant ? item.variant.stock : item.product.stock;
    if (available < item.quantity) throw new Error(`INSUFFICIENT_STOCK:${item.product.title}:${available}:${item.quantity}`);
  }

  const config = storedConfig ?? { taxPercent: 0, shippingFee: 0, freeShippingThreshold: 0 };
  const totals = calculateCartTotals(cart.items, config);
  const normalizedCoupon = input.couponCode?.trim().toUpperCase() || undefined;
  let discountAmount = 0;
  let coupon = null;

  if (normalizedCoupon) {
    coupon = await db.coupon.findUnique({
      where: { code: normalizedCoupon },
      include: { usages: { where: { userId: input.userId } } },
    });
    if (!coupon?.isActive) throw new Error("INVALID_COUPON");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error("COUPON_EXPIRED");
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new Error("COUPON_LIMIT_REACHED");
    if (coupon.usages.length) throw new Error("COUPON_ALREADY_USED");
    if (coupon.minAmount !== null && totals.subtotal < coupon.minAmount) throw new Error(`COUPON_MIN_AMOUNT:${coupon.minAmount}`);
    discountAmount = coupon.type === "PERCENTAGE"
      ? Math.round(totals.subtotal * (coupon.value / 100))
      : Math.min(coupon.value, totals.subtotal);
  }

  const total = Math.max(0, totals.total - discountAmount);
  const buyerName = [address.firstName, address.lastName].filter(Boolean).join(" ") || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const deliveryAddress = [address.neighborhood, address.fullAddress, address.district, address.city, "Türkiye"].filter(Boolean).join(", ");
  const items = cart.items.map((item) => {
    const translation = item.product.translations.find((entry) => entry.locale === input.locale);
    return {
      title: translation?.title || item.product.title,
      variant: item.variant ? (input.locale === "en" ? item.variant.colorEn || item.variant.color : item.variant.color) : null,
      quantity: item.quantity,
      unitPrice: item.product.price,
    };
  });
  const agreement = generateAgreementBundle({
    locale: input.locale,
    buyer: { name: buyerName, email: user.email, phone: address.phone || user.phone || "—" },
    deliveryAddress,
    items,
    currency: "TRY",
    subtotal: totals.subtotal,
    discountAmount,
    taxPercent: config.taxPercent,
    taxAmount: totals.taxAmount,
    shippingAmount: totals.shippingAmount,
    total,
    couponCode: coupon?.code ?? null,
    paymentMethod: input.paymentMethod ?? "BANK_TRANSFER",
  });

  return { user, address, cart, coupon, totals, discountAmount, total, buyerName, deliveryAddress, items, agreement };
}
