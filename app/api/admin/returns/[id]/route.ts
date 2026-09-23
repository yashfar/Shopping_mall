import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { sendReturnResultEmail } from "@@/lib/mail";
import { isAdministrator } from "@@/lib/return-workflow";

const actions = ["approve", "reject", "receive", "inspect_restockable", "inspect_not_restockable", "refund_pending", "refund_completed"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !isAdministrator(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    const { action, adminNote, customerExplanation } = await req.json();
    if (!actions.includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    const rr = await prisma.returnRequest.findUnique({ where: { id }, include: { order: { include: { items: true, user: { select: { email: true, firstName: true, locale: true } } } } } });
    if (!rr) return NextResponse.json({ error: "Return request not found" }, { status: 404 });
    const now = new Date();
    if (["approve", "reject"].includes(action) && rr.status !== "PENDING") return NextResponse.json({ error: "Request is not pending review" }, { status: 409 });
    if (["receive", "inspect_restockable", "inspect_not_restockable", "refund_pending", "refund_completed"].includes(action) && rr.status !== "APPROVED") return NextResponse.json({ error: "Request must be approved first" }, { status: 409 });

    await prisma.$transaction(async (tx) => {
      if (action === "approve") await tx.returnRequest.update({ where: { id }, data: { status: "APPROVED", adminNote: adminNote?.trim() || null, customerExplanation: customerExplanation?.trim() || null, events: { create: { actor: "ADMIN", action: "APPROVED", message: customerExplanation?.trim() || null } } } });
      if (action === "reject") {
        await tx.returnRequest.update({ where: { id }, data: { status: "REJECTED", adminNote: adminNote?.trim() || null, customerExplanation: customerExplanation?.trim() || null, events: { create: { actor: "ADMIN", action: "REJECTED", message: customerExplanation?.trim() || null } } } });
        await tx.order.update({ where: { id: rr.orderId }, data: { status: (rr.previousStatus as never) || "PAID" } });
      }
      if (action === "receive") await tx.returnRequest.update({ where: { id }, data: { receiptStatus: "RECEIVED", receivedAt: rr.receivedAt || now, events: { create: { actor: "ADMIN", action: "RECEIVED", message: customerExplanation?.trim() || null } } } });
      if (action === "inspect_not_restockable") await tx.returnRequest.update({ where: { id }, data: { inspectionStatus: "NOT_RESTOCKABLE", inspectedAt: rr.inspectedAt || now, events: { create: { actor: "ADMIN", action: "INSPECTED_NOT_RESTOCKABLE", message: customerExplanation?.trim() || null } } } });
      if (action === "inspect_restockable") {
        if (rr.receiptStatus !== "RECEIVED") throw new Error("RETURN_NOT_RECEIVED");
        const claimed = await tx.returnRequest.updateMany({ where: { id, restockedAt: null }, data: { inspectionStatus: "RESTOCKABLE", inspectedAt: rr.inspectedAt || now, restockedAt: now } });
        if (claimed.count !== 1) throw new Error("ALREADY_RESTOCKED");
        const variantProducts = new Set<string>();
        for (const item of rr.order.items) {
          if (item.variantId) { await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } }); variantProducts.add(item.productId); }
          else await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity }, isActive: true } });
        }
        for (const productId of variantProducts) { const variants = await tx.productVariant.findMany({ where: { productId }, select: { stock: true } }); await tx.product.update({ where: { id: productId }, data: { stock: variants.reduce((sum, v) => sum + v.stock, 0), isActive: true } }); }
        await tx.returnRequestEvent.create({ data: { returnRequestId: id, actor: "ADMIN", action: "INSPECTED_RESTOCKED", message: customerExplanation?.trim() || null } });
        await tx.order.update({ where: { id: rr.orderId }, data: { status: "RETURNED" } });
      }
      if (action === "refund_pending" || action === "refund_completed") await tx.returnRequest.update({ where: { id }, data: { refundStatus: action === "refund_pending" ? "PENDING" : "COMPLETED", refundUpdatedAt: now, events: { create: { actor: "ADMIN", action: action.toUpperCase(), message: customerExplanation?.trim() || null } } } });
    });

    if (action === "approve" || action === "reject") {
      const locale = rr.order.user.locale === "tr" ? "tr" : "en";
      try {
        await sendReturnResultEmail(rr.order.user.email, {
          orderNumber: rr.order.orderNumber || rr.orderId.slice(0, 8),
          firstName: rr.order.user.firstName,
          approved: action === "approve",
          adminNote: customerExplanation?.trim() || null,
          total: rr.order.total,
          locale,
        });
      } catch {
        console.error("Failed to send return result email");
      }
    }
    return NextResponse.json({ message: "Return workflow updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (["RETURN_NOT_RECEIVED", "ALREADY_RESTOCKED"].includes(message)) return NextResponse.json({ error: message }, { status: 409 });
    console.error("Error processing return workflow");
    return NextResponse.json({ error: "Failed to process return request" }, { status: 500 });
  }
}
