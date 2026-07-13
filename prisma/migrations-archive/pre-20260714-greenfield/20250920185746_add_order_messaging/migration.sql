/*
  Warnings:

  - Added the required column `totalAmount` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "orderId" TEXT;

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "orderNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalAmount" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Conversation_orderId_idx" ON "public"."Conversation"("orderId");

-- CreateIndex
CREATE INDEX "Message_orderNumber_idx" ON "public"."Message"("orderNumber");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
