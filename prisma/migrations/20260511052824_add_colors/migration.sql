/*
  Warnings:

  - The values [XS,XL,XXL] on the enum `Size` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Color" ADD VALUE 'NAVY';
ALTER TYPE "Color" ADD VALUE 'GREY';

-- AlterEnum
BEGIN;
CREATE TYPE "Size_new" AS ENUM ('S', 'M', 'L');
ALTER TABLE "ProductVariant" ALTER COLUMN "size" TYPE "Size_new" USING ("size"::text::"Size_new");
ALTER TYPE "Size" RENAME TO "Size_old";
ALTER TYPE "Size_new" RENAME TO "Size";
DROP TYPE "public"."Size_old";
COMMIT;
