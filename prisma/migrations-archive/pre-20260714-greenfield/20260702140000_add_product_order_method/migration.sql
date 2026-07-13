-- CreateEnum
CREATE TYPE "ProductOrderMethod" AS ENUM ('HOMECHEFF_PAYMENT', 'CONTACT');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "orderMethod" "ProductOrderMethod" NOT NULL DEFAULT 'HOMECHEFF_PAYMENT';
