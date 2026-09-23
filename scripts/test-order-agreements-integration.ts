import assert from "node:assert/strict";
import { prisma } from "../app/lib/prisma";
import { buildCheckoutAgreement } from "../lib/checkout-agreements";
import { deliverOrderAgreements } from "../lib/agreement-delivery";

const prefix = `agreement-it-${Date.now()}`;

function assertIsolatedTarget() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required");
  const target = new URL(value);
  const local = target.hostname === "127.0.0.1" || target.hostname === "localhost";
  if (!local || !target.pathname.toLowerCase().includes("test")) {
    throw new Error("Refusing to run agreement integration tests against a non-local or non-test database");
  }
}

async function main() {
  assertIsolatedTarget();
  const user = await prisma.user.create({ data: { email: `${prefix}@example.invalid`, firstName: "Synthetic", lastName: "Buyer" } });
  const other = await prisma.user.create({ data: { email: `${prefix}-other@example.invalid` } });
  const address = await prisma.address.create({ data: { userId: user.id, title: "Test", firstName: "Synthetic", lastName: "Buyer", phone: "+905550000000", city: "İstanbul", district: "Test", neighborhood: "Test", fullAddress: "Fixture Street 1" } });
  const product = await prisma.product.create({ data: { title: `${prefix}-product`, price: 1250, stock: 10, translations: { create: [{ locale: "tr", title: "Sentetik ürün" }, { locale: "en", title: "Synthetic product" }] } } });
  await prisma.cart.create({ data: { userId: user.id, items: { create: { productId: product.id, quantity: 2 } } } });
  await prisma.paymentConfig.create({ data: { taxPercent: 0, shippingFee: 275, freeShippingThreshold: 999999 } });

  const quote = await prisma.$transaction((tx) => buildCheckoutAgreement(tx, { userId: user.id, addressId: address.id, locale: "tr" }));
  assert.equal(quote.total, 2775);
  await prisma.product.update({ where: { id: product.id }, data: { price: 1300 } });
  const changed = await prisma.$transaction((tx) => buildCheckoutAgreement(tx, { userId: user.id, addressId: address.id, locale: "tr" }));
  assert.notEqual(changed.agreement.bundleHash, quote.agreement.bundleHash, "changed server price must require renewed acceptance");
  await prisma.product.update({ where: { id: product.id }, data: { price: 1250 } });

  const acceptedAt = new Date();
  const order = await prisma.$transaction(async (tx) => tx.order.create({
    data: {
      userId: user.id, orderNumber: `${prefix}-order`, total: quote.total,
      shippingName: quote.buyerName, shippingPhone: quote.address.phone, shippingAddress: quote.deliveryAddress,
      items: { create: quote.cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.product.price })) },
      agreementSnapshots: { create: [
        { documentType: "PRE_CONTRACT_INFORMATION", templateVersion: quote.agreement.templateVersion, locale: "tr", contentHtml: quote.agreement.preContractHtml, integrityHash: quote.agreement.preContractHash, acceptedAt },
        { documentType: "DISTANCE_SALES_AGREEMENT", templateVersion: quote.agreement.templateVersion, locale: "tr", contentHtml: quote.agreement.distanceSalesHtml, integrityHash: quote.agreement.distanceSalesHash, acceptedAt },
      ] },
    },
    include: { agreementSnapshots: true },
  }));

  const immutable = new Map(order.agreementSnapshots.map(({ documentType, contentHtml, integrityHash }) => [documentType, { contentHtml, integrityHash }]));
  await prisma.user.update({ where: { id: user.id }, data: { firstName: "Changed" } });
  await prisma.address.update({ where: { id: address.id }, data: { fullAddress: "Changed later" } });
  await prisma.product.update({ where: { id: product.id }, data: { title: "Changed later", price: 9999 } });
  const persisted = await prisma.orderAgreementSnapshot.findMany({ where: { orderId: order.id }, orderBy: { documentType: "asc" } });
  for (const document of persisted) {
    assert.deepEqual({ contentHtml: document.contentHtml, integrityHash: document.integrityHash }, immutable.get(document.documentType));
  }

  const owned = await prisma.order.findFirst({ where: { id: order.id, userId: user.id }, select: { id: true } });
  const forbidden = await prisma.order.findFirst({ where: { id: order.id, userId: other.id }, select: { id: true } });
  assert.equal(owned?.id, order.id);
  assert.equal(forbidden, null);

  const historical = await prisma.order.create({ data: { userId: user.id, orderNumber: `${prefix}-historical`, total: 100 } });
  assert.equal(await prisma.orderAgreementSnapshot.count({ where: { orderId: historical.id } }), 0, "historical orders must not receive fabricated acceptance");

  process.env.AGREEMENT_EMAIL_SINK = "failure";
  assert.equal((await deliverOrderAgreements(order.id)).status, "failed");
  let delivery = await prisma.orderAgreementSnapshot.findMany({ where: { orderId: order.id } });
  assert.ok(delivery.every((document) => document.deliveryStatus === "FAILED" && document.deliveryAttempts === 1));
  process.env.AGREEMENT_EMAIL_SINK = "success";
  assert.equal((await deliverOrderAgreements(order.id)).status, "sent");
  delivery = await prisma.orderAgreementSnapshot.findMany({ where: { orderId: order.id } });
  assert.ok(delivery.every((document) => document.deliveryStatus === "SENT" && document.deliveryAttempts === 2));
  assert.equal((await deliverOrderAgreements(order.id)).status, "unchanged", "a delivered document must not be sent twice");

  console.log("order agreement integration checks passed");
}

main().finally(async () => prisma.$disconnect());
