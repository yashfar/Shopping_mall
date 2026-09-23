INSERT INTO "User" ("id", "email", "role", "createdAt", "locale")
VALUES ('u1', 'shared-upgrade@example.invalid', 'USER', CURRENT_TIMESTAMP, 'en');

INSERT INTO "Order" (
  "id", "userId", "total", "status", "createdAt", "orderNumber", "currencyCode"
) VALUES
  ('o1', 'u1', 1000, 'RETURNED', CURRENT_TIMESTAMP, 'SHARED-UPGRADE-1', 'TRY'),
  ('o2', 'u1', 1000, 'RETURN_REQUESTED', CURRENT_TIMESTAMP, 'SHARED-UPGRADE-2', 'TRY');

INSERT INTO "ReturnRequest" (
  "id", "orderId", "userId", "reason", "photos", "status", "previousStatus", "updatedAt"
) VALUES
  ('r1', 'o1', 'u1',
   'DAMAGED', ARRAY[]::TEXT[], 'APPROVED', 'COMPLETED', CURRENT_TIMESTAMP),
  ('r2', 'o2', 'u1',
   'CHANGED_MIND', ARRAY[]::TEXT[], 'PENDING', 'COMPLETED', CURRENT_TIMESTAMP);
