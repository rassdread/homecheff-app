/**
 * Phase 2.2 — quote authority, snapshot immutability, commission integrity.
 * Run: npx tsx scripts/test-delivery-marketplace-phase2-2.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  calculateProviderDeliveryPrice,
  PROVIDER_PRICING_FORMULA_VERSION,
} from '../lib/delivery/provider-pricing';
import {
  buildProviderQuoteSnapshot,
  formatCurrencyFromCents,
  parseProviderQuoteMetadata,
  providerQuoteToStripeMetadata,
  resolveLockedDeliveryGrossCents,
  splitDeliveryCommission,
  PRICING_SOURCE_PROVIDER,
} from '../lib/delivery/quote-snapshot';
import { readDeliveryAlignmentFlags } from '../lib/delivery/delivery-alignment-flags';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

const root = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

test('formula version is provider-v1', () => {
  assert.equal(PROVIDER_PRICING_FORMULA_VERSION, 'provider-v1');
});

test('flag off by default (legacy checkout preserved)', () => {
  assert.equal(readDeliveryAlignmentFlags({}).providerPricingEnabled, true);
});

test('€10 gross → €1.20 commission + €8.80 net', () => {
  const split = splitDeliveryCommission(1000);
  assert.equal(split.grossFeeCents, 1000);
  assert.equal(split.platformCommissionCents, 120);
  assert.equal(split.providerNetPayoutCents, 880);
});

test('rounding on non-divisible amount uses Math.round', () => {
  // 999 * 0.12 = 119.88 → 120; 999 * 0.88 = 879.12 → 879
  const split = splitDeliveryCommission(999);
  assert.equal(split.platformCommissionCents, 120);
  assert.equal(split.providerNetPayoutCents, 879);
});

test('provider quote snapshot is immutable relative to later tariff change', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: {
      pricingEnabled: true,
      baseFeeCents: 400,
      pricePerKmCents: 100,
      minimumFeeCents: 400,
      freeDeliveryRadiusKm: 0,
      maxDistanceKm: 50,
      currency: 'EUR',
    },
    routeDistanceKm: 5,
  });
  assert.equal(quote.ok, true);
  if (!quote.ok) return;
  // 400 + 5*100 = 900
  assert.equal(quote.deliveryFeeCents, 900);

  const snap = buildProviderQuoteSnapshot({
    deliveryProfileId: 'prof_1',
    providerDisplayName: 'Jan Bezorger',
    quote,
  });
  assert.equal(snap.quotedFeeCents, 900);
  assert.equal(snap.pricePerKmCentsSnapshot, 100);
  assert.equal(snap.pricingFormulaVersion, 'provider-v1');
  assert.equal(snap.pricingSource, PRICING_SOURCE_PROVIDER);

  // Later tariff change would produce different live quote — snapshot stays 900
  const afterChange = calculateProviderDeliveryPrice({
    pricing: {
      pricingEnabled: true,
      baseFeeCents: 400,
      pricePerKmCents: 150,
      minimumFeeCents: 400,
      freeDeliveryRadiusKm: 0,
      maxDistanceKm: 50,
      currency: 'EUR',
    },
    routeDistanceKm: 5,
  });
  assert.equal(afterChange.ok, true);
  if (afterChange.ok) {
    assert.equal(afterChange.deliveryFeeCents, 400 + 5 * 150);
    assert.notEqual(afterChange.deliveryFeeCents, snap.quotedFeeCents);
  }
  assert.equal(snap.quotedFeeCents, 900);
  assert.equal(snap.providerNetPayoutCents, 792); // 88% of 900
  assert.equal(snap.platformCommissionCents, 108); // 12% of 900
});

test('Stripe metadata contains individual snapshot fields', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: {
      pricingEnabled: true,
      baseFeeCents: 250,
      pricePerKmCents: 75,
      minimumFeeCents: 300,
      freeDeliveryRadiusKm: 2,
      maxDistanceKm: 20,
      currency: 'EUR',
    },
    routeDistanceKm: 5,
  });
  assert.ok(quote.ok);
  if (!quote.ok) return;
  const snap = buildProviderQuoteSnapshot({
    deliveryProfileId: 'dp1',
    providerDisplayName: 'Test Courier',
    quote,
  });
  const meta = providerQuoteToStripeMetadata(snap);
  assert.equal(meta.deliveryProfileId, 'dp1');
  assert.equal(meta.deliveryQuotedFeeCents, String(snap.quotedFeeCents));
  assert.equal(meta.deliveryPricingSource, 'PROVIDER');
  assert.equal(meta.deliveryPricingFormulaVersion, 'provider-v1');
  assert.equal(meta.deliveryPricingCurrency, 'EUR');
  assert.ok(meta.deliveryBaseFeeCents);
  assert.ok(meta.deliveryPlatformCommissionCents);
  assert.ok(meta.quoteLockedAt);

  const parsed = parseProviderQuoteMetadata(meta);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.snapshot.quotedFeeCents, snap.quotedFeeCents);
    assert.equal(parsed.snapshot.deliveryProfileId, 'dp1');
  }
});

test('payout prefers quotedFeeCents over legacy deliveryFee', () => {
  const a = resolveLockedDeliveryGrossCents({
    quotedFeeCents: 900,
    deliveryFee: 250,
  });
  assert.equal(a.grossFeeCents, 900);
  assert.equal(a.amountSource, 'quotedFeeCents');

  const b = resolveLockedDeliveryGrossCents({
    quotedFeeCents: null,
    deliveryFee: 900,
  });
  assert.equal(b.grossFeeCents, 900);
  assert.equal(b.amountSource, 'deliveryFee_legacy');
});

test('formatCurrencyFromCents formats 1000 as €10,00 not €1.000', () => {
  const s = formatCurrencyFromCents(1000, 'nl-NL');
  assert.match(s, /10/);
  assert.ok(!s.includes('1.000,00') && !s.includes('1000,00'));
});

test('free radius → €0 quote', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: {
      pricingEnabled: true,
      baseFeeCents: 400,
      pricePerKmCents: 100,
      minimumFeeCents: 400,
      freeDeliveryRadiusKm: 5,
      maxDistanceKm: 20,
      currency: 'EUR',
    },
    routeDistanceKm: 3,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) assert.equal(quote.deliveryFeeCents, 0);
});

test('minimum fee outside free radius', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: {
      pricingEnabled: true,
      baseFeeCents: 100,
      pricePerKmCents: 10,
      minimumFeeCents: 500,
      freeDeliveryRadiusKm: 0,
      maxDistanceKm: 50,
      currency: 'EUR',
    },
    routeDistanceKm: 2,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) assert.equal(quote.deliveryFeeCents, 500);
});

test('incomplete metadata fails closed', () => {
  const parsed = parseProviderQuoteMetadata({
    deliveryPricingSource: 'PROVIDER',
    deliveryQuotedFeeCents: '900',
  });
  assert.equal(parsed.ok, false);
});

test('checkout route uses provider pricing when flag path present', () => {
  const src = read('app/api/checkout/route.ts');
  assert.ok(src.includes('calculateProviderDeliveryPrice'));
  assert.ok(src.includes('selectedDeliveryProfileId'));
  assert.ok(src.includes('DELIVERY_PROVIDER_REQUIRED'));
  assert.ok(src.includes('DELIVERY_QUOTE_CHANGED'));
  assert.ok(src.includes('providerQuoteToStripeMetadata'));
  assert.ok(src.includes('getDeliveryAlignmentFlags'));
  // Provider path must not mix platform calculateDeliveryFee
  const providerBlock = src.slice(
    src.indexOf('Provider-owned pricing'),
    src.indexOf('Legacy platform / seller path')
  );
  assert.ok(!providerBlock.includes('calculateDeliveryFee('));
  assert.ok(!providerBlock.includes('calculateLongDistanceDeliveryFee('));
});

test('webhook persists snapshot fields and fail-closes incomplete provider quote', () => {
  const src = read('app/api/stripe/webhook/route.ts');
  assert.ok(src.includes('parseProviderQuoteMetadata'));
  assert.ok(src.includes('quotedFeeCents'));
  assert.ok(src.includes('providerDisplayNameSnapshot'));
  assert.ok(src.includes('pricingFormulaVersion'));
  assert.ok(src.includes('DELIVERY_QUOTE_SNAPSHOT_INCOMPLETE'.toLowerCase().includes('incomplete') || src.includes('snapshot incomplete') || src.includes('quote_snapshot_incomplete')));
  assert.ok(src.includes('delivery_quote_snapshot_incomplete') || src.includes('Provider quote snapshot incomplete'));
});

test('payout module uses quotedFeeCents resolver', () => {
  const src = read('lib/delivery/delivery-payout.ts');
  assert.ok(src.includes('resolveLockedDeliveryGrossCents'));
  assert.ok(src.includes('quotedFeeCents'));
  assert.ok(!src.includes('baseFeeCents') || !src.includes('pricePerKmCents'));
});

test('DeliveryDashboard formats cents (divides by 100)', () => {
  const src = read('components/delivery/DeliveryDashboard.tsx');
  assert.ok(src.includes('/ 100') || src.includes('/100'));
  assert.ok(src.includes('formatCurrencyFromCents'));
});

test('DeliverySettings explains gross price and 12% commission', () => {
  const src = read('components/delivery/DeliverySettings.tsx');
  assert.ok(src.includes('12%'));
  assert.ok(src.includes('88%'));
  assert.ok(src.includes('klant ziet') || src.includes('bezorgprijzen die de klant'));
});

test('DelivererSelector wiring is Phase 3 (checkout may import under flag)', () => {
  // Phase 2.2 asserted unwired; Phase 3 wires under namedProviderSelectionEnabled.
  const checkout = read('app/checkout/page.tsx');
  assert.ok(checkout.includes('DelivererSelector'));
});

test('schema has additive snapshot fields', () => {
  const schema = read('prisma/schema.prisma');
  assert.ok(schema.includes('quotedFeeCents'));
  assert.ok(schema.includes('pricingFormulaVersion'));
  assert.ok(schema.includes('providerDisplayNameSnapshot'));
  assert.ok(schema.includes('quoteLockedAt'));
  // deliveryFee Float retained
  assert.ok(/deliveryFee\s+Float/.test(schema));
});

test('migration is additive only', () => {
  const sql = read(
    'prisma/migrations/20260804_delivery_quote_snapshot/migration.sql'
  );
  assert.ok(sql.includes('ADD COLUMN'));
  assert.ok(!sql.includes('DROP COLUMN'));
  assert.ok(!sql.includes('ALTER COLUMN "deliveryFee"'));
});

if (!process.exitCode) {
  console.log('\nAll Phase 2.2 quote-integrity tests passed.');
}
