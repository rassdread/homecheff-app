/**
 * Classify live Connect accounts (no PII).
 * Run: npx tsx --env-file=.env.local scripts/classify-live-connect-accounts.ts
 */
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { classifyStuckExpressCandidate } from '../lib/stripe/connect-tracks';

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_SECRET_KEY missing');
  const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
  const prisma = new PrismaClient();

  const users = await prisma.user.findMany({
    where: { stripeConnectAccountId: { not: null } },
    select: {
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      stripeConnectTrack: true,
      SellerProfile: { select: { kvk: true, companyName: true } },
      Business: { select: { kvkNumber: true, name: true } },
    },
  });

  const rows = [];
  for (const u of users) {
    const id = u.stripeConnectAccountId!;
    if (!id.startsWith('acct_') || id.startsWith('acct_test_')) continue;
    try {
      const a = await stripe.accounts.retrieve(id);
      const classification = classifyStuckExpressCandidate(a);
      rows.push({
        accountId: id,
        classification,
        type: a.type,
        business_type: a.business_type,
        structure: (a as any).company?.structure ?? null,
        dashboard: (a as any).controller?.stripe_dashboard?.type ?? null,
        charges: a.charges_enabled,
        payouts: a.payouts_enabled,
        caps: a.capabilities,
        currently_due: a.requirements?.currently_due ?? [],
        past_due: a.requirements?.past_due ?? [],
        db_completed: u.stripeConnectOnboardingCompleted,
        db_track: u.stripeConnectTrack,
        db_has_kvk: Boolean(u.SellerProfile?.kvk || u.Business?.kvkNumber),
      });
    } catch (e: any) {
      rows.push({
        accountId: id,
        classification: 'RETRIEVE_FAILED',
        error: e.code || e.type,
      });
    }
  }

  console.log(JSON.stringify({ mode: key.startsWith('sk_live') ? 'LIVE' : 'TEST', count: rows.length, rows }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
