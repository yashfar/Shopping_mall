CREATE TYPE "AgreementDocumentType" AS ENUM ('PRE_CONTRACT_INFORMATION', 'DISTANCE_SALES_AGREEMENT');
CREATE TYPE "AgreementDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

ALTER TABLE "Order"
  ADD COLUMN "shippingName" TEXT,
  ADD COLUMN "shippingPhone" TEXT,
  ADD COLUMN "shippingAddress" TEXT;

CREATE TABLE "OrderAgreementSnapshot" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "documentType" "AgreementDocumentType" NOT NULL,
  "templateVersion" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "contentHtml" TEXT NOT NULL,
  "integrityHash" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL,
  "deliveryStatus" "AgreementDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastDeliveryAttemptAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "deliveryError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderAgreementSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderAgreementSnapshot_orderId_documentType_key"
  ON "OrderAgreementSnapshot"("orderId", "documentType");
CREATE INDEX "OrderAgreementSnapshot_orderId_idx" ON "OrderAgreementSnapshot"("orderId");
ALTER TABLE "OrderAgreementSnapshot" ADD CONSTRAINT "OrderAgreementSnapshot_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
