-- AlterTable
-- بنضيف حقول Bosta على Order — جاهزة تخزن بيانات الشحنة لحد ما نتربط بالـ API فعليًا
ALTER TABLE "Order" ADD COLUMN "bostaDeliveryId" TEXT;
ALTER TABLE "Order" ADD COLUMN "bostaTrackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "bostaState" TEXT;
ALTER TABLE "Order" ADD COLUMN "bostaCreatedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "bostaLastSyncAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Order_bostaDeliveryId_key" ON "Order"("bostaDeliveryId");
