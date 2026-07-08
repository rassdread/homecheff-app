#!/usr/bin/env npx tsx
/**
 * Phase 11B — Follow the Money financial integrity guard.
 *
 * Verifies payment lifecycle, idempotency, Stripe wiring, subscription auth,
 * affiliate ledger uniqueness, and chains Phase 11A + prior validators.
 *
 * Run: npx tsx scripts/validate-follow-the-money-phase11b.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const PRIOR_VALIDATORS = [
  'scripts/validate-release-candidate-phase11a.ts',
  'scripts/validate-production-backfill-phase10e.ts',
  'scripts/validate-settlement-router-phase8e.ts',
  'scripts/validate-settlement-options-phase7c.ts',
];

console.log('=== Phase 11B — Follow the Money ===\n');

// --- 11B.1 Deliverables -------------------------------------------------------
console.log('11B.1 Deliverables');
assert(exists('docs/audits/FOLLOW_THE_MONEY_PHASE11B_AUDIT.md'), 'audit doc');
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE11B_FINANCIAL_INTEGRITY.md'),
  'progress doc',
);
assert(exists('scripts/validate-follow-the-money-phase11b.ts'), 'validator script');

// --- 11B.2 Core financial SSOT paths ------------------------------------------
console.log('\n11B.2 Financial SSOT paths');
for (const f of [
  'app/api/checkout/route.ts',
  'app/api/stripe/webhook/route.ts',
  'app/api/stripe/connect/webhook/route.ts',
  'lib/fees.ts',
  'lib/affiliate-commission.ts',
  'lib/affiliate-config.ts',
  'lib/sellerPayouts.ts',
  'lib/releaseEscrowOnDelivered.ts',
  'lib/marketplace/settlement/settlement-router.ts',
]) {
  assert(exists(f), f);
}

// --- 11B.3 Checkout integrity -------------------------------------------------
console.log('\n11B.3 Checkout flow');
const checkout = read('app/api/checkout/route.ts');
assert(checkout.includes('resolveCheckoutBlockReason'), 'checkout: settlement gate');
assert(
  checkout.includes('requiresStripeForHomecheffCheckout'),
  'checkout: Connect readiness check',
);
assert(
  checkout.includes("from '@/lib/product/order-method'"),
  'checkout: order-method import',
);
assert(checkout.includes('stockReservation'), 'checkout: stock reservation');
assert(checkout.includes('stripe.checkout.sessions.create'), 'checkout: Stripe session');

// --- 11B.4 Webhook integrity --------------------------------------------------
console.log('\n11B.4 Stripe webhook');
const webhook = read('app/api/stripe/webhook/route.ts');
assert(webhook.includes('constructEvent'), 'webhook: signature verification');
assert(
  webhook.includes('stripeSessionId: session.id') ||
    webhook.includes('where: { stripeSessionId: session.id }'),
  'webhook: order idempotency by session id',
);
assert(
  !webhook.includes('prisma.subscription.upsert'),
  'webhook: no corrupt subscription catalog upsert',
);
assert(webhook.includes('processCommissionForOrder'), 'webhook: affiliate order commission');
assert(webhook.includes('processCommissionForInvoice'), 'webhook: affiliate subscription commission');
assert(webhook.includes('processCommissionReversal'), 'webhook: commission reversal');

// --- 11B.5 No duplicate order creation ----------------------------------------
console.log('\n11B.5 Order idempotency');
assert(
  read('prisma/schema.prisma').includes('stripeSessionId        String?') ||
    read('prisma/schema.prisma').includes('stripeSessionId String?'),
  'schema: Order.stripeSessionId',
);
assert(
  read('prisma/schema.prisma').includes('stripeSessionId String                 @unique'),
  'schema: StockReservation.stripeSessionId unique',
);

// --- 11B.6 Affiliate commission idempotency -----------------------------------
console.log('\n11B.6 Affiliate ledger idempotency');
const schema = read('prisma/schema.prisma');
assert(schema.includes('eventId                String                    @unique'), 'CommissionLedger.eventId unique');
const affComm = read('lib/affiliate-commission.ts');
assert(affComm.includes('findUnique({'), 'affiliate: existing ledger check');
assert(affComm.includes('eventId: invoiceId'), 'affiliate: invoice eventId');
assert(affComm.includes('eventId: orderId'), 'affiliate: order eventId');

// --- 11B.7 Subscription auth --------------------------------------------------
console.log('\n11B.7 Subscription auth');
const subscribe = read('app/api/subscribe/route.ts');
const subscribeConfirm = read('app/api/subscribe/confirm/route.ts');
assert(
  subscribe.includes("from '@/lib/auth'") || subscribe.includes('from "@/lib/auth"'),
  'subscribe: auth import',
);
assert(subscribe.includes('authSession.user.id'), 'subscribe: session ownership');
assert(subscribeConfirm.includes('authSession.user.id'), 'subscribe/confirm: session ownership');

// --- 11B.8 Escrow release race guard ------------------------------------------
console.log('\n11B.8 Escrow payout integrity');
const escrow = read('lib/releaseEscrowOnDelivered.ts');
assert(escrow.includes("currentStatus: 'held'"), 'escrow: held status filter');
assert(escrow.includes('updateMany'), 'escrow: atomic lock before transfer');
assert(escrow.includes("currentStatus: 'paid_out'"), 'escrow: paid_out on success');

// --- 11B.9 Admin refund payment intent ----------------------------------------
console.log('\n11B.9 Refund path');
const adminRefunds = read('app/api/admin/refunds/route.ts');
assert(adminRefunds.includes("startsWith('cs_')"), 'admin refunds: resolve PI from checkout session');
assert(
  read('app/api/admin/orders/[orderId]/route.ts').includes('payment_intent'),
  'admin order cancel: uses payment_intent',
);

// --- 11B.10 Settlement router on checkout -------------------------------------
console.log('\n11B.10 Settlement SSOT unchanged');
assert(
  read('lib/marketplace/settlement/settlement-router.ts').includes('resolveCheckoutBlockReason'),
  'settlement-router: checkout block reason',
);
assert(!read('lib/marketplace/canonical-model.ts').includes('Phase 11B'), 'no 11B arch stamp');

// --- 11B.11 Connect webhook ---------------------------------------------------
console.log('\n11B.11 Connect webhook');
const connectWebhook = read('app/api/stripe/connect/webhook/route.ts');
assert(connectWebhook.includes('constructEvent'), 'connect webhook: signature verify');

// --- 11B.12 Seller payout request auth ----------------------------------------
console.log('\n11B.12 Payout permissions');
assert(read('app/api/seller/payouts/request/route.ts').includes('auth()'), 'seller payout: session auth');
assert(
  read('app/api/affiliate/payouts/process/route.ts').includes('CRON_SECRET') ||
    read('app/api/affiliate/payouts/process/route.ts').includes('isAdmin'),
  'affiliate payout: admin or cron gate',
);

// --- 11B.13 Legacy mock payment flagged ---------------------------------------
console.log('\n11B.13 Legacy paths documented');
assert(
  read('app/api/payment/create/route.ts').includes('mock') ||
    read('components/PaymentButton.tsx').includes('/api/payment/create'),
  'legacy mock payment path identifiable',
);

// --- 11B.14 Fee model ---------------------------------------------------------
console.log('\n11B.14 Platform fee model');
const fees = read('lib/fees.ts');
assert(fees.includes('DEFAULT_PLATFORM_FEE_PERCENT'), 'individual seller fee');
assert(fees.includes('calculateStripeFeeForBuyer'), 'buyer Stripe fee pass-through');

// --- 11B.15 Chained validators ------------------------------------------------
console.log('\n11B.15 Chained validators');
for (const script of PRIOR_VALIDATORS) {
  assert(exists(script), script);
  try {
    execSync(`npx tsx ${script}`, { stdio: 'pipe', cwd: process.cwd() });
    assert(true, `${path.basename(script)} passed`);
  } catch {
    assert(false, `${path.basename(script)} passed`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
