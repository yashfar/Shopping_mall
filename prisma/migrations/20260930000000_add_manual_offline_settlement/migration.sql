ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CASH';

ALTER TABLE "Payment"
ADD COLUMN "manualNote" TEXT,
ADD COLUMN "manualReference" TEXT,
ADD COLUMN "settledByUserId" TEXT;
