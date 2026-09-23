INSERT INTO "PaymentConfig" (
  "id", "taxPercent", "shippingFee", "freeShippingThreshold", "updatedAt"
) VALUES ('existing-minor-units', 0, 1299, 25000, CURRENT_TIMESTAMP);

\ir ../prisma/migrations/20260922000000_reconcile_application_schema/migration.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "PaymentConfig"
    WHERE "id" = 'existing-minor-units'
      AND "shippingFee" = 1299
      AND "freeShippingThreshold" = 25000
  ) THEN
    RAISE EXCEPTION 'Existing integer minor-unit values changed during reconciliation';
  END IF;
END $$;
