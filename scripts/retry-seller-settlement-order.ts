/**
 * One-shot: retry existing failed seller settlement with source_transaction.
 * Run: npx tsx scripts/retry-seller-settlement-order.ts <orderId>
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { settleAllSellerLegsForOrder } from '../lib/payments/seller-settlement';

const orderId = process.argv[2];
const chargeIdArg = process.argv[3] || null;

if (!orderId) {
  console.error('Usage: npx tsx scripts/retry-seller-settlement-order.ts <orderId> [chargeId]');
  process.exit(1);
}

async function main() {
  const prisma = new PrismaClient();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20' as any,
  });

  try {
    const result = await settleAllSellerLegsForOrder(stripe, orderId, {
      sourceTransactionChargeId: chargeIdArg,
    });
    console.log(JSON.stringify({ result }, null, 2));

    const txs = await prisma.transaction.findMany({
      where: { id: { startsWith: `txn_${orderId}_` } },
      include: { Payout: true },
    });
    console.log(JSON.stringify({ txs }, null, 2));

    if (!result.complete) process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
