ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURN_REQUESTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED','WRONG_ITEM','NOT_AS_DESCRIBED','CHANGED_MIND','OTHER');
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TABLE "ReturnRequest" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT UNIQUE NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "userId" TEXT NOT NULL,
  "reason" "ReturnReason" NOT NULL,
  "note" TEXT,
  "photos" TEXT[] NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
  "previousStatus" TEXT,
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
INSERT INTO "User" ("id","email","role","createdAt") VALUES ('u1','fixture@example.invalid','USER',CURRENT_TIMESTAMP);
INSERT INTO "Order" ("id","userId","total","status","createdAt","orderNumber") VALUES
  ('o1','u1',1000,'RETURNED',CURRENT_TIMESTAMP,'FIXTURE-1'),
  ('o2','u1',1000,'RETURN_REQUESTED',CURRENT_TIMESTAMP,'FIXTURE-2');
INSERT INTO "ReturnRequest" ("id","orderId","userId","reason","photos","status","previousStatus","updatedAt") VALUES
  ('r1','o1','u1','DAMAGED',ARRAY[]::TEXT[],'APPROVED','COMPLETED',CURRENT_TIMESTAMP),
  ('r2','o2','u1','CHANGED_MIND',ARRAY[]::TEXT[],'PENDING','COMPLETED',CURRENT_TIMESTAMP);
