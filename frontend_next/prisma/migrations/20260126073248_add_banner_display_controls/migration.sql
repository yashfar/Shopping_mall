-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "alignment" TEXT NOT NULL DEFAULT 'center',
ADD COLUMN     "displayMode" TEXT NOT NULL DEFAULT 'cover';
