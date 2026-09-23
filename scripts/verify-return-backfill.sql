DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "ReturnRequest"
    WHERE "id" = 'r1'
      AND "receiptStatus" = 'LEGACY_UNKNOWN'
      AND "inspectionStatus" = 'LEGACY_UNKNOWN'
      AND "refundStatus" = 'LEGACY_UNKNOWN'
      AND "legacyReviewRequired" = true
  ) THEN RAISE EXCEPTION 'approved legacy record was not flagged safely'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "ReturnRequest"
    WHERE "id" = 'r2' AND "type" = 'WITHDRAWAL'
      AND "receiptStatus" = 'AWAITING_RECEIPT'
      AND "inspectionStatus" = 'NOT_INSPECTED'
      AND "refundStatus" = 'NOT_STARTED'
      AND "legacyReviewRequired" = false
  ) THEN RAISE EXCEPTION 'pending change-of-mind record was not backfilled'; END IF;
END $$;
