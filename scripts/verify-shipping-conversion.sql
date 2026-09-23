DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "PaymentConfig"
    WHERE "id" = 'nonzero' AND "shippingFee" = 1299 AND "freeShippingThreshold" = 25000
  ) THEN
    RAISE EXCEPTION 'Nonzero minor-unit values changed during conversion';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "PaymentConfig"
    WHERE "id" = 'fractional' AND "shippingFee" = 1300 AND "freeShippingThreshold" = 25000
  ) THEN
    RAISE EXCEPTION 'Fractional values were not rounded as expected';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "PaymentConfig"
    WHERE "id" = 'zero' AND "shippingFee" = 0 AND "freeShippingThreshold" = 0
  ) THEN
    RAISE EXCEPTION 'Zero values changed during conversion';
  END IF;

  BEGIN
    INSERT INTO "PaymentConfig" (
      "id", "taxPercent", "shippingFee", "freeShippingThreshold", "updatedAt"
    ) VALUES ('null-after', 0, NULL, NULL, CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'NULL shipping values were unexpectedly accepted after conversion';
  EXCEPTION WHEN not_null_violation THEN
    NULL;
  END;
END $$;
