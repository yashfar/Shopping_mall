INSERT INTO "PaymentConfig" (
  "id", "taxPercent", "shippingFee", "freeShippingThreshold", "updatedAt"
) VALUES
  ('nonzero', 0, 1299, 25000, CURRENT_TIMESTAMP),
  ('fractional', 0, 1299.6, 25000.4, CURRENT_TIMESTAMP),
  ('zero', 0, 0, 0, CURRENT_TIMESTAMP);

DO $$
BEGIN
  BEGIN
    INSERT INTO "PaymentConfig" (
      "id", "taxPercent", "shippingFee", "freeShippingThreshold", "updatedAt"
    ) VALUES ('null-before', 0, NULL, NULL, CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'NULL shipping values were unexpectedly accepted before conversion';
  EXCEPTION WHEN not_null_violation THEN
    NULL;
  END;
END $$;
