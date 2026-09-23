import { prisma } from "@/lib/prisma";
import { sendAcceptedAgreementEmail } from "@@/lib/mail";

const STALE_SENDING_MS = 10 * 60 * 1000;

export async function deliverOrderAgreements(orderId: string) {
  const claimed = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } }, agreementSnapshots: true },
    });
    if (!order || order.agreementSnapshots.length !== 2) throw new Error("AGREEMENT_SNAPSHOTS_NOT_FOUND");
    if (order.agreementSnapshots.every((document) => document.deliveryStatus === "SENT")) return null;
    const recentSending = order.agreementSnapshots.some((document) => document.deliveryStatus === "SENDING" && document.lastDeliveryAttemptAt && Date.now() - document.lastDeliveryAttemptAt.getTime() < STALE_SENDING_MS);
    if (recentSending) return null;
    const attemptAt = new Date();
    const unsentCount = order.agreementSnapshots.filter((document) => document.deliveryStatus !== "SENT").length;
    const update = await tx.orderAgreementSnapshot.updateMany({
      where: { orderId, deliveryStatus: { not: "SENT" } },
      data: { deliveryStatus: "SENDING", deliveryAttempts: { increment: 1 }, lastDeliveryAttemptAt: attemptAt, deliveryError: null },
    });
    // updateMany re-checks its predicate after waiting on row locks. If another
    // retry claimed the rows first, do not send a second email.
    if (update.count !== unsentCount) return null;
    return { orderNumber: order.orderNumber || order.id.slice(0, 8), email: order.user.email, locale: order.agreementSnapshots[0].locale === "tr" ? "tr" as const : "en" as const, documents: order.agreementSnapshots };
  });
  if (!claimed) return { status: "unchanged" as const };

  const preContract = claimed.documents.find((document) => document.documentType === "PRE_CONTRACT_INFORMATION");
  const distanceSales = claimed.documents.find((document) => document.documentType === "DISTANCE_SALES_AGREEMENT");
  if (!preContract || !distanceSales) throw new Error("AGREEMENT_SNAPSHOTS_NOT_FOUND");
  const result = await sendAcceptedAgreementEmail({
    email: claimed.email,
    orderNumber: claimed.orderNumber,
    locale: claimed.locale,
    preContractHtml: preContract.contentHtml,
    distanceSalesHtml: distanceSales.contentHtml,
  });
  const now = new Date();
  await prisma.orderAgreementSnapshot.updateMany({
    where: { orderId, deliveryStatus: "SENDING" },
    data: result.success
      ? { deliveryStatus: "SENT", deliveredAt: now, deliveryError: null }
      : { deliveryStatus: "FAILED", deliveryError: "Email delivery failed" },
  });
  return { status: result.success ? "sent" as const : "failed" as const };
}
