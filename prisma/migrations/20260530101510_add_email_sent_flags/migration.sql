-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adminEmailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "confirmationEmailSent" BOOLEAN NOT NULL DEFAULT false;
