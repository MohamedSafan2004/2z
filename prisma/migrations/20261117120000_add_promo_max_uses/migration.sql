-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "maxUses" INTEGER,
ADD COLUMN     "usedCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill: احسب الاستخدامات الفعلية الموجودة للكودات القديمة (زي 2ZSAVE10)
UPDATE "PromoCode" p
SET "usedCount" = (
  SELECT COUNT(*) FROM "PromoCodeUsage" u WHERE u."promoCodeId" = p."id"
);
