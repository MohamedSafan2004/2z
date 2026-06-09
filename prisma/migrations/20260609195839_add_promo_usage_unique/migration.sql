/*
  Warnings:

  - A unique constraint covering the columns `[promoCodeId,phone]` on the table `PromoCodeUsage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeUsage_promoCodeId_phone_key" ON "PromoCodeUsage"("promoCodeId", "phone");
