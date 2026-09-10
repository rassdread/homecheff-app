/**
 * Public How-it-works earnings explainer + affiliate dashboard wiring regressions.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE,
  PUBLIC_ATTRIBUTION_COOKIE_DAYS,
  PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT,
  PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT,
  PUBLIC_GROWTH_CALCULATION_VERSION,
  PUBLIC_GROWTH_COMMISSION_MONTHS,
  PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT,
  PUBLIC_GROWTH_HC_CROSS_PLATFORM_CLAIM,
  PUBLIC_GROWTH_PLAN_ECONOMICS,
  PUBLIC_GROWTH_PLANS,
  PUBLIC_LEDGER_PENDING_DAYS,
  PUBLIC_MAIN_PERCENT_OF_ELIGIBLE,
  PUBLIC_MARKETPLACE_MIN_PAYOUT_EUR,
  PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS,
  PUBLIC_MARKETPLACE_SELLER_FEES,
  PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL,
  PUBLIC_STUDIO_COMMISSION_MONTHS,
  PUBLIC_STUDIO_PLAN_ECONOMICS,
  PUBLIC_STUDIO_PLANS,
  PUBLIC_SUB_PERCENT_OF_ELIGIBLE,
  allocateStudioPlanEconomics,
  deliveryExamplePoolCents,
  formatPublicEurNl,
  growthV2AffiliateCommissionCents,
  marketplaceExamplePoolCents,
} from '@/lib/earn/public-economics';
import {
  getEarnHowItWorksCopy,
  earnHowItWorksEn,
  earnHowItWorksNl,
} from '@/lib/i18n/earnHowItWorksSources';
import { getVerdienHubCopy } from '@/lib/i18n/verdienHubSources';
import { DEFAULT_PLATFORM_FEE_PERCENT } from '@/lib/fees';
import { MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE } from '@/lib/marketplace-affiliate-pool';
import { PRICING_TIERS } from '@/lib/pricing';
import {
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT,
  SUB_AFFILIATE_BUSINESS_COMMISSION_PCT,
} from '@/lib/affiliate-config';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('werken-bij hero How it works CTA', () => {
  it('exposes How it works CTA copy and routes to dedicated explainer', () => {
    const hub = read('components/verdien/VerdienHubPage.tsx');
    assert.match(hub, /ctaHowItWorks/);
    assert.match(hub, /href="\/werken-bij\/hoe-werkt-het"/);
    assert.doesNotMatch(
      hub,
      /ctaHowItWorks[\s\S]{0,80}href="\/werken-bij"/,
    );

    const nl = getVerdienHubCopy('nl');
    const en = getVerdienHubCopy('en');
    assert.match(nl.ctaHowItWorks, /Hoe werkt het/i);
    assert.match(en.ctaHowItWorks, /How it works/i);
  });
});

describe('affiliate dashboard How it works route', () => {
  it('routes How it works to /werken-bij/hoe-werkt-het', () => {
    const dash = read('app/affiliate/dashboard/page-client.tsx');
    assert.match(dash, /href="\/werken-bij\/hoe-werkt-het"/);
    assert.match(dash, /howItWorksCta/);
    assert.doesNotMatch(
      dash,
      /howItWorksCta[\s\S]{0,200}href="\/werken-bij"/,
    );

    const eco = read('components/affiliate/HomecheffEcosystemAffiliatePanel.tsx');
    assert.match(eco, /href="\/werken-bij\/hoe-werkt-het"/);
  });

  it('removes pale-green surpriseIncome empty panel', () => {
    const dash = read('app/affiliate/dashboard/page-client.tsx');
    assert.doesNotMatch(dash, /surpriseIncome/);
    assert.doesNotMatch(dash, /bg-emerald-50\/60/);
    assert.doesNotMatch(dash, /affiliate-surprise-income-heading/);
  });

  it('keeps improved subtitle key', () => {
    const nl = JSON.parse(read('public/i18n/nl.json'));
    const en = JSON.parse(read('public/i18n/en.json'));
    assert.match(
      nl.affiliate.dashboard.manageAccount,
      /Beheer je affiliate-account/i,
    );
    assert.match(
      en.affiliate.dashboard.manageAccount,
      /Manage your affiliate account/i,
    );
  });
});

describe('how-it-works dedicated page', () => {
  it('exists and is not the category overview', () => {
    const page = read('app/werken-bij/hoe-werkt-het/page.tsx');
    const hub = read('app/werken-bij/page.tsx');
    assert.match(page, /EarnHowItWorksPage/);
    assert.match(page, /hoe-werkt-het/);
    assert.match(hub, /VerdienHubPage/);
    assert.notEqual(page, hub);
  });

  it('NL and EN copy pass without raw keys or false 50% claims', () => {
    for (const lang of ['nl', 'en'] as const) {
      const c = getEarnHowItWorksCopy(lang);
      const blob = JSON.stringify(c);
      assert.doesNotMatch(blob, /earnHowItWorks\./);
      assert.doesNotMatch(blob, /CUSTOMER_PAYMENT|AFFILIATE_POOL|binder/i);
      // Explicit negation lines are required; positive order/list-price claims are not.
      assert.match(blob, /Niet: 50% van het verkoopbedrag|Not: 50% of the sale amount/i);
      assert.doesNotMatch(blob, /ontvang je 50% van €15|you receive 50% of €15/i);
      assert.doesNotMatch(blob, /Iedereen kan MAIN/i);
      assert.doesNotMatch(blob, /Everyone can become MAIN/i);
      assert.doesNotMatch(blob, /België|Belgium|Turkije|Turkey|Suriname/i);
      assert.doesNotMatch(blob, /cross-border commission|cross.border uplift/i);
      assert.match(blob, /12/);
      assert.match(blob, /platform/i);
      // No stale Growth V1 public commission amounts.
      assert.doesNotMatch(blob, /19,50|19\.50/);
      assert.doesNotMatch(blob, /39,50|39\.50/);
      assert.doesNotMatch(blob, /99,50|99\.50/);
      assert.doesNotMatch(blob, /199,50|199\.50/);
    }
    assert.match(earnHowItWorksNl.marketplaceAffiliate.basis, /platformfee/i);
    assert.match(earnHowItWorksEn.marketplaceAffiliate.basis, /platform fee/i);
    assert.match(earnHowItWorksNl.studio.reward, /commissiemarge|platformopbrengst/i);
    assert.match(earnHowItWorksEn.studio.reward, /commissionable margin|platform revenue/i);
    assert.match(earnHowItWorksNl.growth.rewardDirect, /deelbare marge|HC-face|ex\. btw/i);
    assert.match(earnHowItWorksEn.growth.rewardDirect, /distributable margin|HC face|ex VAT/i);
    assert.match(earnHowItWorksNl.growth.packs, /niet onder affiliate/i);
    assert.match(earnHowItWorksEn.growth.packs, /not commissionable/i);
    assert.match(earnHowItWorksNl.growth.basisBody, /Growth V2|HC-face|deelbare marge/i);
    assert.match(earnHowItWorksEn.growth.basisBody, /Growth V2|HC face|distributable margin/i);
    assert.match(earnHowItWorksNl.growth.basisBody, /binnen Growth/i);
    assert.match(earnHowItWorksEn.growth.basisBody, /within Growth/i);
    assert.equal(PUBLIC_GROWTH_HC_CROSS_PLATFORM_CLAIM, 'GROWTH_ONLY');
    assert.doesNotMatch(earnHowItWorksNl.growth.basisBody, /Studio|Marketplace/i);
    assert.doesNotMatch(earnHowItWorksEn.growth.basisBody, /Studio|Marketplace/i);
    assert.match(earnHowItWorksNl.mainSub.availability, /campagne|uitnodiging|regio/i);
    assert.match(earnHowItWorksEn.mainSub.availability, /campaign|invitation|region/i);
    assert.equal(earnHowItWorksNl.growth.planCards.length, 4);
    assert.equal(earnHowItWorksNl.studio.planCards.length, 3);
    assert.match(earnHowItWorksNl.growth.planCards[0].commission, /15,75/);
    assert.match(earnHowItWorksNl.growth.planCards[1].commission, /25,50/);
    assert.match(earnHowItWorksNl.growth.planCards[2].commission, /49,50/);
    assert.match(earnHowItWorksNl.growth.planCards[3].commission, /109,50/);
    assert.match(earnHowItWorksNl.growth.planCards[0].includedCredits!, /750/);
    assert.match(earnHowItWorksNl.growth.planCards[0].leadQuota!, /175/);
    assert.match(earnHowItWorksNl.studio.planCards[0].commission, /1,70/);
    assert.match(earnHowItWorksNl.studio.basisBody, /niet over de volledige abonnementsprijs/i);
    assert.match(earnHowItWorksEn.studio.basisBody, /not on the full subscription list price/i);
    assert.match(
      earnHowItWorksNl.growth.planCards[0].recurring,
      /kwalificerende betaalde abonnementsperiode, maximaal 12 maanden/,
    );
  });
});

describe('economics SoT drift protection', () => {
  it('Marketplace public fees match canonical config 12/9/7/5', () => {
    assert.equal(PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT, DEFAULT_PLATFORM_FEE_PERCENT);
    assert.equal(PUBLIC_MARKETPLACE_SELLER_FEES.individual.percent, 12);
    assert.equal(PUBLIC_MARKETPLACE_SELLER_FEES.basic.percent, 9);
    assert.equal(PUBLIC_MARKETPLACE_SELLER_FEES.pro.percent, 7);
    assert.equal(PUBLIC_MARKETPLACE_SELLER_FEES.premium.percent, 5);
    assert.equal(
      PUBLIC_MARKETPLACE_SELLER_FEES.basic.percent,
      PRICING_TIERS.BUSINESS_BASIC.feePercentage,
    );
    assert.equal(
      PUBLIC_MARKETPLACE_SELLER_FEES.pro.monthlyEur,
      PRICING_TIERS.BUSINESS_PRO.monthlyFee,
    );
  });

  it('Marketplace affiliate pool and MAIN/SUB match engine constants', () => {
    assert.equal(
      PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE,
      MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE,
    );
    assert.equal(PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE, 50);
    assert.equal(PUBLIC_MAIN_PERCENT_OF_ELIGIBLE, Math.round(PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT * 100));
    assert.equal(PUBLIC_SUB_PERCENT_OF_ELIGIBLE, Math.round(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT * 100));
    assert.equal(PUBLIC_MAIN_PERCENT_OF_ELIGIBLE, 10);
    assert.equal(PUBLIC_SUB_PERCENT_OF_ELIGIBLE, 40);
  });

  it('Marketplace €100 example yields €12 fee and max €6 pool', () => {
    const ex = marketplaceExamplePoolCents(100, 12);
    assert.equal(ex.feeEur, 12);
    assert.equal(ex.poolEur, 6);
  });

  it('Growth prices, HC, lead quotas and duration match V2 Balanced SoT', () => {
    assert.deepEqual(
      PUBLIC_GROWTH_PLANS.map((p) => p.monthlyEurExVat),
      [0, 39, 79, 199, 399],
    );
    assert.deepEqual(
      PUBLIC_GROWTH_PLANS.map((p) => p.monthlyHc),
      [0, 750, 2800, 10000, 18000],
    );
    assert.deepEqual(
      PUBLIC_GROWTH_PLANS.map((p) => p.monthlyLeadQuota),
      [0, 175, 850, 3200, 5500],
    );
    assert.equal(PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT, 50);
    assert.equal(PUBLIC_GROWTH_COMMISSION_MONTHS, 12);
    assert.equal(PUBLIC_GROWTH_CALCULATION_VERSION, 'GROWTH_AFFILIATE_V2_RESIDUAL_HC');
    // Lead quota is NOT HC/3 (starter 175 ≠ 250).
    const starter = PUBLIC_GROWTH_PLANS.find((p) => p.key === 'starter')!;
    assert.equal(starter.monthlyLeadQuota, 175);
    assert.equal(starter.monthlyHc, 750);
    assert.notEqual(starter.monthlyLeadQuota, Math.floor(starter.monthlyHc / 3));
  });

  it('growthV2AffiliateCommissionCents matches cent-exact V2 table', () => {
    const expected = [
      { net: 3900, hc: 750, commissionCents: 1575 },
      { net: 7900, hc: 2800, commissionCents: 2550 },
      { net: 19900, hc: 10000, commissionCents: 4950 },
      { net: 39900, hc: 18000, commissionCents: 10950 },
    ];
    for (const row of expected) {
      const snap = growthV2AffiliateCommissionCents(row.net, row.hc);
      assert.equal(snap.affiliateCommissionCents, row.commissionCents);
      assert.equal(snap.hcReserveCents, row.hc);
      assert.equal(snap.commissionableCents, row.net - row.hc);
    }
  });

  it('Growth plan economics match V2 residual-HC payout at cent level', () => {
    const expected = [
      { key: 'starter', price: 39, hc: 750, leads: 175, commission: 15.75 },
      { key: 'pro', price: 79, hc: 2800, leads: 850, commission: 25.5 },
      { key: 'business', price: 199, hc: 10000, leads: 3200, commission: 49.5 },
      { key: 'enterprise', price: 399, hc: 18000, leads: 5500, commission: 109.5 },
    ];
    assert.equal(PUBLIC_GROWTH_PLAN_ECONOMICS.length, expected.length);
    for (const row of expected) {
      const eco = PUBLIC_GROWTH_PLAN_ECONOMICS.find((p) => p.key === row.key)!;
      assert.equal(eco.priceEurExVat, row.price);
      assert.equal(eco.includedHc, row.hc);
      assert.equal(eco.monthlyLeadQuota, row.leads);
      assert.equal(eco.hcReserveEur, row.hc / 100);
      assert.equal(eco.commissionableBaseEur, (row.price * 100 - row.hc) / 100);
      assert.equal(eco.directVariableCostEur, eco.hcReserveEur);
      assert.equal(eco.affiliateCommissionEur, row.commission);
      assert.equal(eco.calculationVersion, 'GROWTH_AFFILIATE_V2_RESIDUAL_HC');
      const snap = growthV2AffiliateCommissionCents(
        Math.round(row.price * 100),
        row.hc,
      );
      assert.equal(eco.affiliateCommissionEur, snap.affiliateCommissionCents / 100);
    }
  });

  it('Studio live prices and HC grants match Stage 1 SoT', () => {
    assert.deepEqual(
      PUBLIC_STUDIO_PLANS.map((p) => p.monthlyEur),
      [15, 29, 79],
    );
    assert.deepEqual(
      PUBLIC_STUDIO_PLANS.map((p) => p.monthlyHc),
      [900, 1800, 5000],
    );
    assert.equal(PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL, 50);
    assert.equal(PUBLIC_STUDIO_COMMISSION_MONTHS, 12);
  });

  it('Studio residuals match live Growth-repo Model A formula at cent level', () => {
    const expected = [
      { key: 'creator' as const, margin: 3.39, aff: 1.7 },
      { key: 'pro' as const, margin: 6.21, aff: 3.11 },
      { key: 'studio' as const, margin: 16.43, aff: 8.22 },
    ];
    for (const row of expected) {
      const eco = PUBLIC_STUDIO_PLAN_ECONOMICS.find((p) => p.key === row.key)!;
      assert.equal(eco.distributableMarginEur, row.margin);
      assert.equal(eco.affiliateCommissionEur, row.aff);
      const rebuilt = allocateStudioPlanEconomics({
        key: row.key,
        grossPriceEur: eco.priceEurGrossInclVat,
        hcGranted: eco.includedHc,
      });
      assert.equal(rebuilt.affiliateCommissionEur, eco.affiliateCommissionEur);
      assert.ok(eco.affiliateCommissionEur < eco.priceEurGrossInclVat * 0.5);
    }
    assert.match(formatPublicEurNl(1.7), /1,70/);
    assert.match(formatPublicEurNl(3.39), /3,39/);
  });

  it('Display copy commissions equal economics SoT (NL)', () => {
    const nl = earnHowItWorksNl;
    for (const eco of PUBLIC_GROWTH_PLAN_ECONOMICS) {
      const card = nl.growth.planCards.find((c) => c.key === eco.key)!;
      assert.match(card.commission, new RegExp(formatPublicEurNl(eco.affiliateCommissionEur)));
      assert.match(card.availableMargin, new RegExp(formatPublicEurNl(eco.commissionableBaseEur)));
      assert.match(card.hcReserve!, new RegExp(formatPublicEurNl(eco.hcReserveEur)));
      assert.match(card.leadQuota!, new RegExp(eco.monthlyLeadQuota.toLocaleString('nl-NL')));
      assert.match(card.includedCredits!, new RegExp(eco.includedHc.toLocaleString('nl-NL')));
    }
    for (const eco of PUBLIC_STUDIO_PLAN_ECONOMICS) {
      const card = nl.studio.planCards.find((c) => c.key === eco.key)!;
      assert.match(card.commission, new RegExp(formatPublicEurNl(eco.affiliateCommissionEur)));
      assert.match(card.availableMargin, new RegExp(formatPublicEurNl(eco.distributableMarginEur)));
    }
  });

  it('Delivery example and windows match certified values', () => {
    assert.equal(PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT, 12);
    const d = deliveryExamplePoolCents(20);
    assert.equal(d.feeEur, 2.4);
    assert.equal(d.poolEur, 1.2);
    assert.equal(PUBLIC_ATTRIBUTION_COOKIE_DAYS, 30);
    assert.equal(PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS, 365);
    assert.equal(PUBLIC_LEDGER_PENDING_DAYS, 14);
    assert.equal(PUBLIC_MARKETPLACE_MIN_PAYOUT_EUR, 10);
  });
});

describe('share architecture allowlist', () => {
  it('allows hoe-werkt-het share destination', () => {
    const resolve = read('lib/share/resolve-marketplace-share-url.ts');
    assert.match(resolve, /\/werken-bij\/hoe-werkt-het/);
    const ctx = read('hooks/useMarketplaceShareContext.ts');
    assert.match(ctx, /\/werken-bij\/hoe-werkt-het/);
  });
});
