export type ReturnKind = "WITHDRAWAL" | "ISSUE";

export function validateReturnSubmission(input: {
  type: ReturnKind;
  reason?: string | null;
  photos?: unknown;
}) {
  const photos = Array.isArray(input.photos)
    ? input.photos.filter((photo): photo is string => typeof photo === "string").slice(0, 5)
    : [];
  if (input.type === "ISSUE" && !input.reason) return { error: "Reason is required for an issue report", photos };
  return { error: null, photos };
}

export function customerOwnsOrder(orderUserId: string, sessionUserId?: string) {
  return Boolean(sessionUserId) && orderUserId === sessionUserId;
}

export function isAdministrator(role?: string | null) {
  return role === "ADMIN";
}

export function canReopenReturn(status: string) {
  return status === "REJECTED";
}

export function returnActionEffects(action: string, state: { restockedAt?: Date | null }) {
  return {
    restoresInventory: action === "inspect_restockable" && !state.restockedAt,
    completesRefund: action === "refund_completed",
  };
}
