-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('BUY_X_GET_Y_FREE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "promotionDiscount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL DEFAULT 'BUY_X_GET_Y_FREE',
    "triggerQuantity" INTEGER NOT NULL,
    "freeQuantity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_isActive_idx" ON "Promotion"("isActive");