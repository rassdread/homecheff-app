/**
 * LEGAL-3 consumer information / withdrawal validation.
 *   npx tsx scripts/validate-legal-3-consumer-information.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildConsumerCommerceContext,
  mergeConsumerCommerceContexts,
} from '../lib/legal/consumer-commerce-context';
import { WITHDRAWAL_RULES } from '../lib/legal/withdrawal-rules';
import { TERMS_VERSION, TERMS_EFFECTIVE_DATE } from '../lib/legal/document-versions';
import { INTEGRITY_HIDE_MIN_UNIQUE_REPORTERS } from '../lib/trust/credibility';

const ROOT = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

assert.equal(WITHDRAWAL_RULES.length, 7);
assert.equal(TERMS_VERSION, '1.1');
assert.equal(TERMS_EFFECTIVE_DATE, '2026-08-15');
assert.equal(TERMS_EFFECTIVE_DATE.includes('T'), false);

// A private handmade fixed-price
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'PRIVATE_OCCASIONAL' },
    product: {
      priceCents: 1500,
      priceModel: 'FIXED',
      barterOpenness: 'MONEY',
      marketplaceCategory: 'DESIGN',
    },
  });
  assert.equal(ctx.withdrawalRule, 'NOT_APPLICABLE_PRIVATE_C2C');
  assert.equal(ctx.isPrivateSellerPath, true);
  assert.equal(ctx.isProfessionalSellerPath, false);
}

// B professional handmade stock
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 2000,
      priceModel: 'FIXED',
      barterOpenness: 'MONEY',
      marketplaceCategory: 'DESIGN',
      madeToConsumerSpecifications: false,
    },
  });
  assert.equal(ctx.withdrawalRule, 'STANDARD_14_DAY');
}

// C professional personalised — requires explicit madeTo flag, NOT TRUST PERSONALISED alone
{
  const without = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 2500,
      priceModel: 'FIXED',
      marketplaceCategory: 'DESIGN',
      madeToConsumerSpecifications: false,
    },
  });
  assert.equal(without.withdrawalRule, 'STANDARD_14_DAY');
  const withFlag = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 2500,
      priceModel: 'FIXED',
      marketplaceCategory: 'DESIGN',
      madeToConsumerSpecifications: true,
    },
  });
  assert.equal(withFlag.withdrawalRule, 'CUSTOM_OR_PERSONALISED_EXCEPTION');
}

// D professional prepared perishable
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 1200,
      priceModel: 'FIXED',
      marketplaceCategory: 'CREATE',
      category: 'CHEFF',
      rapidlyPerishable: true,
    },
  });
  assert.equal(ctx.isPreparedFood, true);
  assert.equal(ctx.withdrawalRule, 'PERISHABLE_EXCEPTION');
}

// E private prepared food
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'PRIVATE_OCCASIONAL' },
    product: {
      priceCents: 800,
      marketplaceCategory: 'CREATE',
      rapidlyPerishable: true,
    },
  });
  assert.equal(ctx.withdrawalRule, 'NOT_APPLICABLE_PRIVATE_C2C');
}

// F professional service
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 5000,
      marketplaceCategory: 'PRACTICAL_SERVICE',
      priceModel: 'HOURLY',
    },
  });
  assert.equal(ctx.isService, true);
  assert.equal(ctx.withdrawalRule, 'FULLY_PERFORMED_SERVICE_EXCEPTION');
}

// G service start during withdrawal
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 5000,
      marketplaceCategory: 'ARTISTIC_SERVICE',
    },
    serviceStartDuringWithdrawalRequested: true,
  });
  assert.equal(ctx.serviceStartAckRequired, true);
}

// H ON_REQUEST professional
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 0,
      priceModel: 'ON_REQUEST',
      marketplaceCategory: 'DESIGN',
    },
  });
  assert.equal(ctx.isOnRequest, true);
  assert.equal(ctx.withdrawalRule, 'STANDARD_14_DAY');
}

// I BARTER_ONLY professional
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 0,
      barterOpenness: 'BARTER_ONLY',
      marketplaceCategory: 'DESIGN',
    },
  });
  assert.equal(ctx.isBarterOnly, true);
  assert.equal(ctx.withdrawalRule, 'STANDARD_14_DAY');
}

// J MONEY_AND_BARTER
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 1000,
      barterOpenness: 'MONEY_AND_BARTER',
      marketplaceCategory: 'DESIGN',
    },
  });
  assert.equal(ctx.hasMoneyComponent, true);
  assert.equal(ctx.withdrawalRule, 'STANDARD_14_DAY');
}

// K free sharing
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'PRIVATE_OCCASIONAL' },
    product: {
      priceCents: 0,
      priceModel: 'VOLUNTARY',
      barterOpenness: 'MONEY',
    },
  });
  assert.equal(ctx.withdrawalRule, 'NOT_APPLICABLE_FREE');
  assert.equal(ctx.showConsumerDisclosure, false);
}

// L undeclared legacy
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'UNDECLARED' },
    product: { priceCents: 1000, priceModel: 'FIXED' },
  });
  assert.equal(ctx.withdrawalRule, 'REQUIRES_REVIEW');
  assert.equal(ctx.isUndeclaredPath, true);
}

// M verified business
{
  const ctx = buildConsumerCommerceContext({
    seller: {
      commerceDeclaration: 'UNDECLARED',
      verifiedBusiness: true,
    },
    product: { priceCents: 1000, priceModel: 'FIXED', marketplaceCategory: 'DESIGN' },
  });
  assert.equal(ctx.isProfessionalSellerPath, true);
  assert.equal(ctx.publicLabel, 'geverifieerd_bedrijf');
  assert.equal(ctx.withdrawalRule, 'STANDARD_14_DAY');
}

// N GROW not auto-perishable
{
  const ctx = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: {
      priceCents: 500,
      marketplaceCategory: 'GROW',
      category: 'GARDEN',
      rapidlyPerishable: false,
    },
  });
  assert.equal(ctx.withdrawalRule, 'STANDARD_14_DAY');
}

// No auto trader from code paths
{
  const src = read('lib/legal/consumer-commerce-context.ts');
  assert.equal(src.includes('isLegalTrader'), false);
  assert.equal(src.includes('DAC7'), false);
  assert.equal(src.includes('paidListingCount'), false);
  assert.equal(src.includes('transactionCount'), false);
  assert.equal(/\b€?\s*2[\.,]?000\b/.test(src), false);
  assert.equal(/\b30\s*sales\b/i.test(src), false);
}

// LEGAL-1/2/TRUST untouched thresholds
assert.equal(INTEGRITY_HIDE_MIN_UNIQUE_REPORTERS, 3);
{
  const feed = read('lib/feed/feed-product-query.server.ts');
  assert.equal(feed.includes('madeToConsumerSpecifications'), false);
  assert.equal(feed.includes('withdrawalRule'), false);
  assert.equal(feed.includes('consumerCommerce'), false);
}

// Migration additive
{
  const mig = read(
    'prisma/migrations/20260815140000_legal3_consumer_information/migration.sql',
  );
  assert.match(mig, /madeToConsumerSpecifications/);
  assert.match(mig, /rapidlyPerishable/);
  assert.equal(/UPDATE\s+"Product"\s+SET/i.test(mig), false);
}

// Merge cart contexts
{
  const a = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'PRIVATE_OCCASIONAL' },
    product: { priceCents: 1000 },
  });
  const b = buildConsumerCommerceContext({
    seller: { commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL' },
    product: { priceCents: 1000, marketplaceCategory: 'DESIGN' },
  });
  const m = mergeConsumerCommerceContexts([a, b]);
  assert.ok(m);
  assert.equal(m!.isProfessionalSellerPath, true);
  assert.equal(m!.withdrawalRule, 'STANDARD_14_DAY');
}

console.log('LEGAL-3 consumer information validation: OK');
