-- Baseline migration: registers changes that already exist live in the database
-- (applied previously via db push, never recorded as a migration file).
-- Guarded with IF NOT EXISTS checks -- safe to run even if already present.
-- Nothing is dropped, nothing destructive.

-- 1. OrderStatus enum: add PENDING_PAYMENT if missing
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';

-- 2. Order table: shippingCost, shippingZone
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCost" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingZone" TEXT;

-- 3. Product table: originalPrice
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(65,30);
