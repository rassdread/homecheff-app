import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateBusinessSubscriptionCommission,
  calculateParentAffiliateBusinessCommission,
} from '@/lib/affiliate-config';
import { marketplaceSaleEconomics } from '@/lib/affiliate/marketplace-sale-economics';
import {
  CATALOG_ORDER_ASSUMPTION_EUR,
  buildAffiliateCommissionCatalog,
} from '@/lib/affiliate/commission-catalog';
import { calculatePlatformFeeCents } from '@/lib/fees';
import { viewerOrderAffiliateCents } from '@/lib/earn/passive-income-scenario';
import {
  PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT,
  PUBLIC_GROWTH_PLAN_ECONOMICS,
  PUBLIC_MARKETPLACE_SELLER_FEES,
  PUBLIC_STUDIO_PACKS,
  PUBLIC_STUDIO_PLAN_ECONOMICS,
  allocateStudioPlanEconomics,
  growthV2AffiliateCommissionCents,
} from '@/lib/earn/public-economics';

test('verdienen catalogue matches the current commission helpers', () => {
  const rows = buildAffiliateCommissionCatalog();
  const byId = new Map(rows.map((row) => [row.id, row]));

  for (const plan of PUBLIC_GROWTH_PLAN_ECONOMICS) {
    const row = byId.get(`growth-${plan.key}`);
    assert.ok(row, plan.key);
    const engine = growthV2AffiliateCommissionCents(
      Math.round(plan.priceEurExVat * 100),
      plan.affiliateCapacityHc,
    );
    assert.equal(row.affiliateCents, engine.affiliateCommissionCents);
    assert.equal(row.affiliateCents, Math.round(plan.affiliateCommissionEur * 100));
  }

  for (const plan of PUBLIC_STUDIO_PLAN_ECONOMICS) {
    const row = byId.get(`studio-${plan.key}`);
    assert.ok(row, plan.key);
    const engine = allocateStudioPlanEconomics({
      key: plan.key,
      grossPriceEur: plan.priceEurGrossInclVat,
      hcGranted: plan.includedHc,
    });
    assert.equal(row.affiliateCents, Math.round(engine.affiliateCommissionEur * 100));
  }

  for (const pack of PUBLIC_STUDIO_PACKS) {
    const row = byId.get(`studio-pack-${pack.hc}`);
    assert.ok(row, String(pack.hc));
    const engine = allocateStudioPlanEconomics({
      key: 'creator',
      grossPriceEur: pack.priceEur,
      hcGranted: pack.hc,
    });
    assert.equal(row.affiliateCents, Math.round(engine.affiliateCommissionEur * 100));
  }

  for (const plan of [
    ['basic', PUBLIC_MARKETPLACE_SELLER_FEES.basic],
    ['pro', PUBLIC_MARKETPLACE_SELLER_FEES.pro],
    ['premium', PUBLIC_MARKETPLACE_SELLER_FEES.premium],
  ] as const) {
    if (!plan[1].monthlyEur) continue;
    const cents = Math.round(plan[1].monthlyEur * 100);
    const row = byId.get(`marketplace-plan-${plan[0]}`);
    assert.ok(row, plan[0]);
    const direct = calculateBusinessSubscriptionCommission(cents, 0, false);
    assert.equal(row.affiliateCents, direct.finalAffiliateCommissionCents);
    assert.equal(row.networkMainCents, calculateParentAffiliateBusinessCommission(cents));
  }

  const sale = marketplaceSaleEconomics({
    saleCents: CATALOG_ORDER_ASSUMPTION_EUR * 100,
    feePercent: PUBLIC_MARKETPLACE_SELLER_FEES.individual.percent,
  });
  assert.equal(byId.get('marketplace-buyer')?.affiliateCents, sale.singleAffiliate.viewerCommissionCents);
  assert.equal(byId.get('marketplace-seller')?.affiliateCents, sale.singleAffiliate.viewerCommissionCents);

  const deliveryFee = calculatePlatformFeeCents(1000, PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT);
  const delivery = viewerOrderAffiliateCents({ platformFeeCents: deliveryFee, scenario: 'single' });
  assert.equal(byId.get('delivery-fee')?.affiliateCents, delivery.viewerCommissionCents);
});
