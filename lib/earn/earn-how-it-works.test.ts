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
  PUBLIC_GROWTH_COMMISSION_MONTHS,
  PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT,
  PUBLIC_GROWTH_PLANS,
  PUBLIC_LEDGER_PENDING_DAYS,
  PUBLIC_MAIN_PERCENT_OF_ELIGIBLE,
  PUBLIC_MARKETPLACE_MIN_PAYOUT_EUR,
  PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS,
  PUBLIC_MARKETPLACE_SELLER_FEES,
  PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL,
  PUBLIC_STUDIO_COMMISSION_MONTHS,
  PUBLIC_STUDIO_PLANS,
  PUBLIC_SUB_PERCENT_OF_ELIGIBLE,
  deliveryExamplePoolCents,
  growthDirectExampleEur,
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
    }
    assert.match(earnHowItWorksNl.marketplaceAffiliate.basis, /platformfee/i);
    assert.match(earnHowItWorksEn.marketplaceAffiliate.basis, /platform fee/i);
    assert.match(earnHowItWorksNl.studio.reward, /platformopbrengst/i);
    assert.match(earnHowItWorksEn.studio.reward, /platform revenue/i);
    assert.match(earnHowItWorksNl.growth.rewardDirect, /ex\. btw|exclusief btw/i);
    assert.match(earnHowItWorksEn.growth.rewardDirect, /excluding VAT|ex VAT/i);
    assert.match(earnHowItWorksNl.growth.packs, /niet onder affiliate/i);
    assert.match(earnHowItWorksEn.growth.packs, /not commissionable/i);
    assert.match(earnHowItWorksNl.mainSub.availability, /campagne|uitnodiging|regio/i);
    assert.match(earnHowItWorksEn.mainSub.availability, /campaign|invitation|region/i);
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

  it('Growth prices and duration match Stage 1 SoT', () => {
    assert.deepEqual(
      PUBLIC_GROWTH_PLANS.map((p) => p.monthlyEurExVat),
      [0, 39, 79, 199, 399],
    );
    assert.equal(PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT, 50);
    assert.equal(PUBLIC_GROWTH_COMMISSION_MONTHS, 12);
    assert.equal(growthDirectExampleEur(39).affiliateEur, 19.5);
    assert.equal(growthDirectExampleEur(79).affiliateEur, 39.5);
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
