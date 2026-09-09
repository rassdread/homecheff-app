/**
 * One-shot audit: affiliate vs User Stripe Connect fields (read-only).
 * Run: npx tsx --env-file=.env.local scripts/audit-affiliate-user-stripe-binding.ts
 */
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import {
  deriveConnectAccountStatusFromStripe,
  shouldEmitStripeOnboardAction,
} from '../lib/stripe/connect-account-status';

async function main() {
  const prisma = new PrismaClient();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  });
  const rows = await prisma.user.findMany({
    where: { affiliate: { isNot: null } },
    select: {
      id: true,
      email: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      SellerProfile: { select: { id: true } },
      DeliveryProfile: { select: { id: true } },
      affiliate: {
        select: {
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      },
    },
  });
  console.log('affiliate_users', rows.length);
  let mismatchCount = 0;
  for (const u of rows) {
    const userAcct = u.stripeConnectAccountId;
    const affAcct = u.affiliate?.stripeConnectAccountId ?? null;
    const mismatch =
      Boolean(userAcct) !== Boolean(affAcct) ||
      (Boolean(userAcct) && Boolean(affAcct) && userAcct !== affAcct) ||
      Boolean(u.stripeConnectOnboardingCompleted) !==
        Boolean(u.affiliate?.stripeConnectOnboardingCompleted);
    if (mismatch) mismatchCount += 1;
    if (!userAcct && !affAcct && !mismatch) continue;
    let live: Record<string, unknown> | null = null;
    if (userAcct) {
      try {
        const a = await stripe.accounts.retrieve(userAcct);
        const d = deriveConnectAccountStatusFromStripe(a);
        live = {
          ui: d.uiStatus,
          emit: shouldEmitStripeOnboardAction(d.uiStatus),
          ch: a.charges_enabled,
          po: a.payouts_enabled,
        };
      } catch (e: unknown) {
        live = { err: e instanceof Error ? e.message : String(e) };
      }
    }
    console.log(
      JSON.stringify({
        id: u.id.slice(0, 8),
        email: (u.email || '').replace(/(.{2}).+(@.+)/, '$1***$2'),
        seller: Boolean(u.SellerProfile),
        delivery: Boolean(u.DeliveryProfile),
        userAcct: userAcct ? userAcct.slice(0, 14) : null,
        userDone: u.stripeConnectOnboardingCompleted,
        affAcct: affAcct ? affAcct.slice(0, 14) : null,
        affDone: u.affiliate?.stripeConnectOnboardingCompleted,
        mismatch,
        live,
      }),
    );
  }
  console.log('mismatch_count', mismatchCount);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
