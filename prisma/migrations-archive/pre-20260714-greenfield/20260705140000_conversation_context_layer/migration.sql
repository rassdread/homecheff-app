-- CreateEnum
CREATE TYPE "ConversationContextType" AS ENUM ('PRODUCT', 'ORDER', 'DELIVERY', 'SERVICE', 'TASK', 'REQUEST', 'BARTER', 'GENERAL', 'PARTNER');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'DISPUTED');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "contextType" "ConversationContextType" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "Conversation" ADD COLUMN "contextId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Conversation" ADD COLUMN "metadata" JSONB;

-- CreateIndex
CREATE INDEX "Conversation_contextType_contextId_idx" ON "Conversation"("contextType", "contextId");
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- Backfill context from legacy FK columns (idempotent)
UPDATE "Conversation"
SET "contextType" = 'ORDER', "contextId" = "orderId"
WHERE "orderId" IS NOT NULL;

UPDATE "Conversation"
SET "contextType" = 'PRODUCT', "contextId" = "productId"
WHERE "productId" IS NOT NULL AND "orderId" IS NULL;
