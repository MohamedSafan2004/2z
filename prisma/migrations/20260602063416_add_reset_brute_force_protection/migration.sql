-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resetLockedUntil" TIMESTAMP(3);
