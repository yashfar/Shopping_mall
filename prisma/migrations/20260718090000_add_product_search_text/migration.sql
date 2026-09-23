-- Add a normalized search field without changing the original product text.
ALTER TABLE "Product"
ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '';
