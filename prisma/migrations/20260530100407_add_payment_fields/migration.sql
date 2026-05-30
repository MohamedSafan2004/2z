/*
  Warnings:

  - A unique constraint covering the columns `[verifyToken]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "lastPaymentCheckAt" TIMESTAMP(3),
ADD COLUMN     "verifyToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_verifyToken_key" ON "Order"("verifyToken");
