/**
 * Idempotent backfill for Conversation contextType/contextId from legacy FKs.
 *
 * Usage: npx tsx scripts/backfill-conversation-context.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orderResult = await prisma.$executeRaw`
    UPDATE "Conversation"
    SET "contextType" = 'ORDER'::"ConversationContextType", "contextId" = "orderId"
    WHERE "orderId" IS NOT NULL
      AND ("contextType" = 'GENERAL'::"ConversationContextType" OR "contextId" IS NULL)
  `;

  const productResult = await prisma.$executeRaw`
    UPDATE "Conversation"
    SET "contextType" = 'PRODUCT'::"ConversationContextType", "contextId" = "productId"
    WHERE "productId" IS NOT NULL
      AND "orderId" IS NULL
      AND ("contextType" = 'GENERAL'::"ConversationContextType" OR "contextId" IS NULL)
  `;

  console.info('[backfill-conversation-context] done', {
    orderRows: orderResult,
    productRows: productResult,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
