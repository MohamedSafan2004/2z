/*
  Warnings:

  - The values [NAVY] on the enum `Color` will be removed. If these variants are still used in the database, this will fail.
  - The values [S] on the enum `Size` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Color_new" AS ENUM ('BLACK', 'WHITE', 'GREY', 'BEIGE');
ALTER TABLE "ProductVariant" ALTER COLUMN "color" TYPE "Color_new" USING ("color"::text::"Color_new");
ALTER TYPE "Color" RENAME TO "Color_old";
ALTER TYPE "Color_new" RENAME TO "Color";
DROP TYPE "public"."Color_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Size_new" AS ENUM ('M', 'L', 'XL');
ALTER TABLE "ProductVariant" ALTER COLUMN "size" TYPE "Size_new" USING ("size"::text::"Size_new");
ALTER TYPE "Size" RENAME TO "Size_old";
ALTER TYPE "Size_new" RENAME TO "Size";
DROP TYPE "public"."Size_old";
COMMIT;
