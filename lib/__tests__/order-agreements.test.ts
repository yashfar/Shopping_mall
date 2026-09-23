import assert from "node:assert/strict";
import test from "node:test";
import { validateAgreementAcceptance } from "../checkout-agreements";
import { generateAgreementBundle, type AgreementInput } from "../order-agreements";

const input: AgreementInput = {
  locale: "tr",
  buyer: { name: "Synthetic Buyer", email: "buyer@example.invalid", phone: "+90 555 000 00 00" },
  deliveryAddress: "Synthetic test address",
  items: [{ title: "Test product", variant: "Kırmızı", quantity: 2, unitPrice: 1299 }],
  currency: "TRY",
  subtotal: 2598,
  discountAmount: 100,
  taxPercent: 0,
  taxAmount: 0,
  shippingAmount: 250,
  total: 2748,
  couponCode: "TEST",
};

test("server acceptance requires an explicit checkbox and exact SHA-256 bundle hash", () => {
  const bundle = generateAgreementBundle(input);
  assert.equal(validateAgreementAcceptance({ acceptedBundleHash: bundle.bundleHash }), false);
  assert.equal(validateAgreementAcceptance({ acceptedDocuments: false, acceptedBundleHash: bundle.bundleHash }), false);
  assert.equal(validateAgreementAcceptance({ acceptedDocuments: true, acceptedBundleHash: "not-a-hash" }), false);
  assert.equal(validateAgreementAcceptance({ acceptedDocuments: true, acceptedBundleHash: bundle.bundleHash }), true);
});

test("material checkout changes produce a different acceptance binding", () => {
  const original = generateAgreementBundle(input);
  const changedPrice = generateAgreementBundle({ ...input, subtotal: 2698, total: 2848, items: [{ ...input.items[0], unitPrice: 1349 }] });
  const changedAddress = generateAgreementBundle({ ...input, deliveryAddress: "A different delivery address" });
  assert.notEqual(changedPrice.bundleHash, original.bundleHash);
  assert.notEqual(changedAddress.bundleHash, original.bundleHash);
});

test("documents are bilingual, self-contained, and contain the confirmed seller address", () => {
  for (const locale of ["tr", "en"] as const) {
    const bundle = generateAgreementBundle({ ...input, locale });
    assert.match(bundle.preContractHtml, /^<!doctype html>/);
    assert.match(bundle.distanceSalesHtml, /34524 Beylikdüzü, İstanbul, Türkiye/);
    assert.match(bundle.distanceSalesHtml, /Bank transfer|Banka havalesi/);
  }
});
