/**
 * Validates Conversation contextType/contextId backfill integrity.
 *
 * Usage: npx tsx scripts/validate-conversation-context.ts
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env.local' });
config();

const prisma = new PrismaClient();

async function main() {
  const columnCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Conversation'
        AND column_name = 'contextType'
    ) AS exists
  `;

  if (!columnCheck[0]?.exists) {
    console.error(
      'FAIL: Conversation.contextType column missing — run migration 20260705140000_conversation_context_layer first.',
    );
    process.exitCode = 1;
    return;
  }

  const total = await prisma.conversation.count();

  const byType = await prisma.conversation.groupBy({
    by: ['contextType'],
    _count: { _all: true },
  });

  const withOrderId = await prisma.conversation.count({
    where: { orderId: { not: null } },
  });
  const withProductId = await prisma.conversation.count({
    where: { productId: { not: null } },
  });

  const orderContextMismatchRows = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count FROM "Conversation"
    WHERE "orderId" IS NOT NULL
      AND ("contextType" != 'ORDER' OR "contextId" IS DISTINCT FROM "orderId")
  `;
  const orderContextMismatch = Number(orderContextMismatchRows[0]?.count ?? 0);

  const productContextMismatchRows = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`
    SELECT COUNT(*)::bigint AS count FROM "Conversation"
    WHERE "productId" IS NOT NULL
      AND "orderId" IS NULL
      AND ("contextType" != 'PRODUCT' OR "contextId" IS DISTINCT FROM "productId")
  `;
  const productContextMismatch = Number(productContextMismatchRows[0]?.count ?? 0);

  const nullContextIdWithFk = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM "Conversation"
    WHERE "contextId" IS NULL
      AND ("productId" IS NOT NULL OR "orderId" IS NOT NULL)
  `;
  const orphanContextId = Number(nullContextIdWithFk[0]?.count ?? 0);

  const reservationOnly = await prisma.conversation.count({
    where: {
      reservationId: { not: null },
      productId: null,
      orderId: null,
      contextType: 'GENERAL',
    },
  });

  const statusBreakdown = await prisma.conversation.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  console.info('=== Conversation Context Validation ===\n');
  console.info(`Total conversations: ${total}`);
  console.info('\nBy contextType:');
  for (const row of byType) {
    console.info(`  ${row.contextType}: ${row._count._all}`);
  }
  console.info('\nLegacy FK counts:');
  console.info(`  with orderId: ${withOrderId}`);
  console.info(`  with productId: ${withProductId}`);
  console.info('\nIntegrity checks:');
  console.info(`  ORDER context mismatches: ${orderContextMismatch}`);
  console.info(`  PRODUCT context mismatches: ${productContextMismatch}`);
  console.info(`  FK present but contextId null: ${orphanContextId}`);
  console.info(`  reservation-only (GENERAL): ${reservationOnly}`);
  console.info('\nBy status:');
  for (const row of statusBreakdown) {
    console.info(`  ${row.status}: ${row._count._all}`);
  }

  const ok =
    orderContextMismatch === 0 &&
    productContextMismatch === 0 &&
    orphanContextId === 0;

  console.info(`\nResult: ${ok ? 'PASS' : 'FAIL — run backfill-conversation-context.ts'}`);
  if (!ok) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
