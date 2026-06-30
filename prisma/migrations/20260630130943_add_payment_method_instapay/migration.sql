-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'INSTAPAY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "instapayRef" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD';
