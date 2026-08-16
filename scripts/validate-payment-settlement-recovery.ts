/**
 * P0 payment settlement recovery validators.
 * Run: npx tsx scripts/validate-payment-settlement-recovery.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const middleware = read('middleware.ts');
assert.match(middleware, /isStripeWebhookPath/);
assert.match(middleware, /\/api\/stripe\/webhook/);
assert.match(middleware, /!isStripeWebhookPath/);

const schema = read('prisma/schema.prisma');
assert.match(
  schema,
  /reservationId\s+String\?\s+@unique/,
);
assert.match(schema, /Reservation\s+Reservation\?/);

const migration = read(
  'prisma/migrations/20260816180000_transaction_reservation_optional/migration.sql',
);
assert.match(migration, /DROP NOT NULL/);

const settlement = read('lib/payments/seller-settlement.ts');
assert.match(settlement, /settleSellerOrderItem/);
assert.match(settlement, /settleAllSellerLegsForOrder/);
assert.match(settlement, /source_transaction/);
assert.match(settlement, /resolveChargeIdForCheckoutSession/);
assert.match(settlement, /hc_seller_xfer_.*_stx_/);
assert.match(settlement, /Missing source_transaction Charge id/);
assert.match(settlement, /transfer_group: `order_\$\{orderId\}`/);
assert.match(settlement, /stripeConnectAccountId/);
assert.match(settlement, /platform_fallback_blocked|Refused platform account fallback/);
assert.doesNotMatch(settlement, /destination:\s*process\.env\.STRIPE_PLATFORM/);
assert.doesNotMatch(settlement, /Arrias Beheer/);

const webhook = read('app/api/stripe/webhook/route.ts');
assert.match(webhook, /settleSellerOrderItem/);
assert.match(webhook, /settleAllSellerLegsForOrder/);
assert.match(webhook, /Settlement incomplete/);
assert.match(webhook, /Seller settlement incomplete/);
assert.doesNotMatch(
  webhook,
  /returning OK despite error/,
);
assert.doesNotMatch(
  webhook,
  /Order \$\{existingOrder\.id\} already exists for session \$\{session\.id\}`\);\s*return new NextResponse\("ok"/,
);

// Controlled €1 math (inline — avoid top-level await)
function platformFee(amountCents: number, pct: number) {
  return Math.round((amountCents * pct) / 100);
}
assert.equal(platformFee(100, 12), 12);
assert.equal(100 - 12, 88);
assert.equal(127 - 29, 98);
assert.equal(98 - 88, 10);
assert.equal(88 + 10 + 29, 127);

const sellerUi = read('components/seller/SellerFinancialManagement.tsx');
assert.match(sellerUi, /isTransferSuccess/);
assert.match(sellerUi, /startsWith\('tr_'\)/);
assert.match(sellerUi, /sellerTransferPending|uitbetaling wordt verwerkt/);

const alerts = read('app/api/admin/alerts/route.ts');
assert.match(alerts, /SETTLEMENT_PENDING/);

console.log('validate-payment-settlement-recovery: OK');
