import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canReopenReturn, customerOwnsOrder, returnActionEffects, validateReturnSubmission } from "../return-workflow";

describe("return workflow", () => {
  it("accepts withdrawal without a reason or photo", () => {
    assert.deepEqual(validateReturnSubmission({ type: "WITHDRAWAL" }), { error: null, photos: [] });
  });
  it("enforces customer ownership", () => {
    assert.equal(customerOwnsOrder("owner", "owner"), true);
    assert.equal(customerOwnsOrder("owner", "other"), false);
    assert.equal(customerOwnsOrder("owner"), false);
  });
  it("allows rejected requests to be reopened", () => {
    assert.equal(canReopenReturn("REJECTED"), true);
    assert.equal(canReopenReturn("PENDING"), false);
  });
  it("approval does not restore inventory or complete a refund", () => {
    assert.deepEqual(returnActionEffects("approve", {}), { restoresInventory: false, completesRefund: false });
  });
  it("restocks only once", () => {
    assert.equal(returnActionEffects("inspect_restockable", {}).restoresInventory, true);
    assert.equal(returnActionEffects("inspect_restockable", { restockedAt: new Date() }).restoresInventory, false);
  });
  it("keeps refund completion separate from approval", () => {
    assert.equal(returnActionEffects("approve", {}).completesRefund, false);
    assert.equal(returnActionEffects("refund_completed", {}).completesRefund, true);
  });
});
