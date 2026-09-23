BEGIN;

-- The return feature existed in the Prisma schema before it was represented in
-- migration history. Establish that legacy baseline only when it is absent.
DO $$ BEGIN CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURN_REQUESTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';

CREATE TABLE IF NOT EXISTS "ReturnRequest" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" "ReturnReason" NOT NULL,
  "note" TEXT,
  "photos" TEXT[] NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
  "previousStatus" TEXT,
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReturnRequest_orderId_key" UNIQUE ("orderId"),
  CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

DO $$ BEGIN CREATE TYPE "ReturnRequestType" AS ENUM ('WITHDRAWAL', 'ISSUE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReturnReceiptStatus" AS ENUM ('AWAITING_RECEIPT', 'RECEIVED', 'LEGACY_UNKNOWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReturnInspectionStatus" AS ENUM ('NOT_INSPECTED', 'RESTOCKABLE', 'NOT_RESTOCKABLE', 'LEGACY_UNKNOWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReturnRefundStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'COMPLETED', 'NOT_REQUIRED', 'LEGACY_UNKNOWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReturnEventActor" AS ENUM ('CUSTOMER', 'ADMIN', 'SYSTEM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "ReturnRequest"
  ADD COLUMN IF NOT EXISTS "type" "ReturnRequestType" NOT NULL DEFAULT 'ISSUE',
  ALTER COLUMN "reason" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "customerExplanation" TEXT,
  ADD COLUMN IF NOT EXISTS "receiptStatus" "ReturnReceiptStatus" NOT NULL DEFAULT 'AWAITING_RECEIPT',
  ADD COLUMN IF NOT EXISTS "inspectionStatus" "ReturnInspectionStatus" NOT NULL DEFAULT 'NOT_INSPECTED',
  ADD COLUMN IF NOT EXISTS "refundStatus" "ReturnRefundStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "inspectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "restockedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refundUpdatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legacyReviewRequired" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ReturnRequest" SET "type" = 'WITHDRAWAL' WHERE "reason" = 'CHANGED_MIND';

-- Legacy approvals/RETURNED orders are ambiguous: do not infer receipt, inspection,
-- stock restoration correctness, or refund completion.
UPDATE "ReturnRequest"
SET "receiptStatus" = 'LEGACY_UNKNOWN',
    "inspectionStatus" = 'LEGACY_UNKNOWN',
    "refundStatus" = 'LEGACY_UNKNOWN',
    "legacyReviewRequired" = true
WHERE "status" = 'APPROVED';

CREATE TABLE IF NOT EXISTS "ReturnRequestEvent" (
  "id" TEXT NOT NULL,
  "returnRequestId" TEXT NOT NULL,
  "actor" "ReturnEventActor" NOT NULL,
  "action" TEXT NOT NULL,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReturnRequestEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ReturnRequestEvent_returnRequestId_createdAt_idx" ON "ReturnRequestEvent"("returnRequestId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "ReturnRequestEvent" ADD CONSTRAINT "ReturnRequestEvent_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
