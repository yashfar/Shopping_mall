import assert from "node:assert/strict";
import { prisma } from "../app/lib/prisma";
import { customerOwnsOrder, isAdministrator } from "../lib/return-workflow";

const prefix = `return-it-${Date.now()}`;
const customerId = `${prefix}-customer`;
const otherId = `${prefix}-other`;
const adminId = `${prefix}-admin`;
const productId = `${prefix}-product`;
const orderId = `${prefix}-order`;

function assertIsolatedTarget() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required");
  const target = new URL(value);
  const local = target.hostname === "127.0.0.1" || target.hostname === "localhost";
  const namedAsTest = target.pathname.toLowerCase().includes("test");
  if (!local || !namedAsTest) throw new Error("Refusing to run integration tests against a non-local or non-test database");
}

async function restockOnce(requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.returnRequest.findUniqueOrThrow({ where: { id: requestId }, include: { order: { include: { items: true } } } });
    if (request.receiptStatus !== "RECEIVED") throw new Error("not received");
    const claimed = await tx.returnRequest.updateMany({ where: { id: requestId, restockedAt: null }, data: { inspectionStatus: "RESTOCKABLE", inspectedAt: new Date(), restockedAt: new Date() } });
    if (claimed.count !== 1) throw new Error("already restocked");
    for (const item of request.order.items) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
  });
}

async function main() {
  assertIsolatedTarget();
  await prisma.user.createMany({ data: [
    { id: customerId, email: `${customerId}@example.invalid`, role: "USER" },
    { id: otherId, email: `${otherId}@example.invalid`, role: "USER" },
    { id: adminId, email: `${adminId}@example.invalid`, role: "ADMIN" },
  ] });
  await prisma.product.create({ data: { id: productId, title: "Synthetic return fixture", price: 1000, stock: 5 } });
  await prisma.order.create({ data: { id: orderId, userId: customerId, total: 2000, status: "COMPLETED", items: { create: { productId, quantity: 2, price: 1000 } } } });

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  assert.equal(customerOwnsOrder(order.userId, customerId), true);
  assert.equal(customerOwnsOrder(order.userId, otherId), false);
  const roles = await prisma.user.findMany({ where: { id: { in: [adminId, customerId] } }, select: { id: true, role: true } });
  assert.equal(isAdministrator(roles.find((u) => u.id === adminId)?.role), true);
  assert.equal(isAdministrator(roles.find((u) => u.id === customerId)?.role), false);

  const request = await prisma.returnRequest.create({ data: { orderId, userId: customerId, type: "WITHDRAWAL", reason: null, photos: [], previousStatus: "COMPLETED", events: { create: { actor: "CUSTOMER", action: "SUBMITTED" } } } });
  await assert.rejects(() => prisma.returnRequest.create({ data: { orderId, userId: customerId, type: "WITHDRAWAL", photos: [] } }));
  await prisma.returnRequest.update({ where: { id: request.id }, data: { status: "REJECTED", adminNote: "private", customerExplanation: "public", events: { create: { actor: "ADMIN", action: "REJECTED", message: "public" } } } });
  await prisma.returnRequest.update({ where: { id: request.id }, data: { status: "PENDING", events: { create: { actor: "CUSTOMER", action: "REOPENED", message: "follow-up" } } } });
  assert.equal(await prisma.returnRequestEvent.count({ where: { returnRequestId: request.id } }), 3);

  const stockBefore = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock;
  await prisma.returnRequest.update({ where: { id: request.id }, data: { status: "APPROVED", customerExplanation: "send item" } });
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock, stockBefore);
  assert.equal((await prisma.returnRequest.findUniqueOrThrow({ where: { id: request.id } })).refundStatus, "NOT_STARTED");
  await prisma.returnRequest.update({ where: { id: request.id }, data: { receiptStatus: "RECEIVED", receivedAt: new Date() } });
  const attempts = await Promise.allSettled([restockOnce(request.id), restockOnce(request.id)]);
  assert.equal(attempts.filter((a) => a.status === "fulfilled").length, 1);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock, stockBefore + 2);
  assert.equal((await prisma.returnRequest.findUniqueOrThrow({ where: { id: request.id } })).refundStatus, "NOT_STARTED");
  await prisma.returnRequest.update({ where: { id: request.id }, data: { refundStatus: "PENDING", refundUpdatedAt: new Date() } });
  await prisma.returnRequest.update({ where: { id: request.id }, data: { refundStatus: "COMPLETED", refundUpdatedAt: new Date() } });

  const customerView = await prisma.returnRequest.findUniqueOrThrow({ where: { id: request.id }, select: { status: true, customerExplanation: true, receiptStatus: true, inspectionStatus: true, refundStatus: true } });
  assert.equal("adminNote" in customerView, false);
  assert.equal(customerView.refundStatus, "COMPLETED");
  console.log("return workflow integration checks passed");
}

main().finally(async () => { await prisma.$disconnect(); });
