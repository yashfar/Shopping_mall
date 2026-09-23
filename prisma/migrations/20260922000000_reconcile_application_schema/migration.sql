-- Reconcile application schema changes that historically reached shared databases
-- without checked-in migrations. This migration is intentionally additive: shared-only
-- objects are preserved, while existing objects are validated before being reused.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CouponType') THEN
    CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
  ELSIF (
    SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder)
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'CouponType'
  ) <> ARRAY['PERCENTAGE', 'FIXED_AMOUNT'] THEN
    RAISE EXCEPTION 'Existing CouponType enum is incompatible with the application schema';
  END IF;
END $$;

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_UPLOADED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_REJECTED';

DROP INDEX IF EXISTS "CartItem_cartId_productId_key";

ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameEn" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "Category" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "Category" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "couponId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProofPath" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCompany" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currencyCode" TEXT NOT NULL DEFAULT 'TRY';
ALTER TABLE "Order" ALTER COLUMN "orderNumber" DROP NOT NULL;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantColor" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "accountHolder" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "bankName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "bankTransferNote" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "iban" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "usdAccountHolder" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "usdBankName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "usdBankTransferNote" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "usdFreeShippingThreshold" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "usdIban" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "usdShippingFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PaymentConfig" ADD COLUMN IF NOT EXISTS "usdSwiftCode" TEXT NOT NULL DEFAULT '';

DO $$
DECLARE
  shipping_type TEXT;
  threshold_type TEXT;
BEGIN
  SELECT data_type INTO shipping_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'PaymentConfig' AND column_name = 'shippingFee';
  SELECT data_type INTO threshold_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'PaymentConfig' AND column_name = 'freeShippingThreshold';

  IF shipping_type = 'double precision' THEN
    ALTER TABLE "PaymentConfig"
      ALTER COLUMN "shippingFee" TYPE INTEGER USING ROUND("shippingFee")::INTEGER;
  ELSIF shipping_type <> 'integer' THEN
    RAISE EXCEPTION 'PaymentConfig.shippingFee has incompatible type: %', shipping_type;
  END IF;

  IF threshold_type = 'double precision' THEN
    ALTER TABLE "PaymentConfig"
      ALTER COLUMN "freeShippingThreshold" TYPE INTEGER USING ROUND("freeShippingThreshold")::INTEGER;
  ELSIF threshold_type <> 'integer' THEN
    RAISE EXCEPTION 'PaymentConfig.freeShippingThreshold has incompatible type: %', threshold_type;
  END IF;
END $$;

ALTER TABLE "PaymentConfig" ALTER COLUMN "shippingFee" SET DEFAULT 0;
ALTER TABLE "PaymentConfig" ALTER COLUMN "freeShippingThreshold" SET DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "salePrice" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';

CREATE TABLE IF NOT EXISTS "CategoryTranslation" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductPrice" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "currencyCode" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "salePrice" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductTranslation" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "colorHex" TEXT,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "images" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "colorEn" TEXT;

CREATE TABLE IF NOT EXISTS "Wishlist" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockAlert" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "notified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "CouponType" NOT NULL,
  "value" INTEGER NOT NULL,
  "minAmount" INTEGER,
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponUsage" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContactMessage" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductTranslation_productId_locale_key"
  ON "ProductTranslation"("productId", "locale");
CREATE UNIQUE INDEX IF NOT EXISTS "CategoryTranslation_categoryId_locale_key"
  ON "CategoryTranslation"("categoryId", "locale");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductPrice_productId_currencyCode_key"
  ON "ProductPrice"("productId", "currencyCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Wishlist_userId_productId_key"
  ON "Wishlist"("userId", "productId");
CREATE UNIQUE INDEX IF NOT EXISTS "StockAlert_userId_productId_key"
  ON "StockAlert"("userId", "productId");
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "CouponUsage_orderId_key" ON "CouponUsage"("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "CouponUsage_couponId_userId_key"
  ON "CouponUsage"("couponId", "userId");
CREATE INDEX IF NOT EXISTS "CartItem_cartId_productId_variantId_idx"
  ON "CartItem"("cartId", "productId", "variantId");
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_userId_productId_key"
  ON "Review"("userId", "productId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CategoryTranslation_categoryId_fkey' AND conrelid = '"CategoryTranslation"'::regclass) THEN
    ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductPrice_productId_fkey' AND conrelid = '"ProductPrice"'::regclass) THEN
    ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductTranslation_productId_fkey' AND conrelid = '"ProductTranslation"'::regclass) THEN
    ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductVariant_productId_fkey' AND conrelid = '"ProductVariant"'::regclass) THEN
    ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_variantId_fkey' AND conrelid = '"CartItem"'::regclass) THEN
    ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_couponId_fkey' AND conrelid = '"Order"'::regclass) THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey"
      FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_variantId_fkey' AND conrelid = '"OrderItem"'::regclass) THEN
    ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Wishlist_userId_fkey' AND conrelid = '"Wishlist"'::regclass) THEN
    ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Wishlist_productId_fkey' AND conrelid = '"Wishlist"'::regclass) THEN
    ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockAlert_userId_fkey' AND conrelid = '"StockAlert"'::regclass) THEN
    ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockAlert_productId_fkey' AND conrelid = '"StockAlert"'::regclass) THEN
    ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CouponUsage_couponId_fkey' AND conrelid = '"CouponUsage"'::regclass) THEN
    ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey"
      FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CouponUsage_userId_fkey' AND conrelid = '"CouponUsage"'::regclass) THEN
    ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CouponUsage_orderId_fkey' AND conrelid = '"CouponUsage"'::regclass) THEN
    ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Fail rather than silently accept same-named tables with incompatible key columns.
DO $$
DECLARE
  mismatch TEXT;
BEGIN
  SELECT string_agg(format('%I.%I expected %s%s', expected.table_name, expected.column_name,
                           expected.udt_name, CASE WHEN expected.nullable THEN ' nullable' ELSE ' not null' END), ', ')
    INTO mismatch
    FROM (VALUES
      ('Category','isActive','bool',false), ('Category','createdAt','timestamp',false),
      ('Category','updatedAt','timestamp',false),
      ('CategoryTranslation','categoryId','text',false), ('CategoryTranslation','locale','text',false),
      ('ProductPrice','productId','text',false), ('ProductPrice','currencyCode','text',false),
      ('ProductTranslation','productId','text',false), ('ProductTranslation','locale','text',false),
      ('ProductVariant','productId','text',false), ('ProductVariant','stock','int4',false),
      ('Wishlist','userId','text',false), ('Wishlist','productId','text',false),
      ('StockAlert','userId','text',false), ('StockAlert','productId','text',false),
      ('Coupon','code','text',false), ('Coupon','type','CouponType',false),
      ('CouponUsage','couponId','text',false), ('CouponUsage','userId','text',false),
      ('CouponUsage','orderId','text',false), ('CartItem','variantId','text',true),
      ('Order','couponId','text',true), ('Order','currencyCode','text',false),
      ('OrderItem','variantId','text',true), ('ProductVariant','colorEn','text',true),
      ('PaymentConfig','shippingFee','int4',false),
      ('PaymentConfig','freeShippingThreshold','int4',false),
      ('Product','searchText','text',false), ('Product','salePrice','int4',true),
      ('User','locale','text',false)
    ) AS expected(table_name, column_name, udt_name, nullable)
    LEFT JOIN information_schema.columns c
      ON c.table_schema = 'public'
     AND c.table_name = expected.table_name
     AND c.column_name = expected.column_name
   WHERE c.column_name IS NULL
      OR c.udt_name <> expected.udt_name
      OR (c.is_nullable = 'YES') <> expected.nullable;

  IF mismatch IS NOT NULL THEN
    RAISE EXCEPTION 'Reconciliation found incompatible existing columns: %', mismatch;
  END IF;
END $$;
