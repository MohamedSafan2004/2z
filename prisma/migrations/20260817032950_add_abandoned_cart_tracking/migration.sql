-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "abandonedCartEmailSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
