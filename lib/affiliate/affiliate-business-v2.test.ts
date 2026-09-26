import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  buildAffiliateCommissionCatalog,
  sortCatalog,
} from '@/lib/affiliate/commission-catalog';
import {
  individualSaleExamples,
  marketplaceSaleEconomics,
} from '@/lib/affiliate/marketplace-sale-economics';
import {
  submitMarketInterest,
  type MarketInterestDraft,
} from '@/lib/affiliate/market-interest';
import { decideAffiliateMarket } from '@/lib/affiliate/affiliate-markets';
import {
  MAIN_SUB_HIERARCHY,
  NETWORK_DASHBOARD,
  SELF_SERVICE_SUB_CREATION,
  SUB_INVITE_FLOW,
} from '@/lib/affiliate/network-capability';
import {
  alongsideWorkJourney,
  growthStarterCustomersForMonthlyTarget,
  growthStarterShareCents,
} from '@/lib/affiliate/portfolio-scenario';
import { affiliatePropositionFaqs } from '@/lib/affiliate/proposition-faqs';
import { getAffiliateLandingFaqJsonLd } from '@/lib/seo/affiliateLandingStructuredData';
import { calculatePlatformFeeCents } from '@/lib/fees';
import { PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT } from '@/lib/earn/public-economics';

const root = '/Users/sergioarrias/HomeCheffProjects/homecheff-app';

describe('affiliate business v2', () => {
  it('keeps acquired customers past month 12', () => {
    const month12 = alongsideWorkJourney(12);
    const month13 = alongsideWorkJourney(13);
    const year2 = alongsideWorkJourney(24);
    const year3 = alongsideWorkJourney(36);
    const year5 = alongsideWorkJourney(60);
    assert.equal(month12.activeGrowth, 24);
    assert.equal(month13.activeGrowth, 26);
    assert.ok(month13.ownCents > month12.ownCents);
    assert.equal(year2.activeGrowth, 48);
    assert.equal(year3.activeGrowth, 72);
    assert.equal(year5.activeGrowth, 120);
    assert.equal(year2.retainedFromYearOne, 24);
    assert.equal(year2.addedAfterYearOne, 24);
  });

  it('uses the certified Growth Starter residual, not 50% of the customer price', () => {
    const share = growthStarterShareCents();
    assert.equal(share.directCents, 1575);
    assert.equal(share.subCents + share.mainCents, 1575);
    assert.notEqual(share.directCents, 2350);
    const month1 = alongsideWorkJourney(1);
    assert.equal(month1.ownCents, 2 * 1575);
  });

  it('shows what €3k, €10k and €20k require in Starter customers', () => {
    const three = growthStarterCustomersForMonthlyTarget(3000);
    const ten = growthStarterCustomersForMonthlyTarget(10000);
    const twenty = growthStarterCustomersForMonthlyTarget(20000);
    assert.equal(three.customers, Math.ceil(300000 / 1575));
    assert.equal(ten.customers, Math.ceil(1_000_000 / 1575));
    assert.equal(twenty.customers, Math.ceil(2_000_000 / 1575));
    assert.ok(ten.customers > 500);
    assert.ok(twenty.customers > ten.customers);
  });

  it('lists live commissionable products and excludes a fake free-plan commission', () => {
    const rows = buildAffiliateCommissionCatalog();
    const ids = rows.map((row) => row.id);
    assert.ok(ids.includes('growth-starter'));
    assert.ok(ids.includes('growth-enterprise'));
    assert.ok(ids.includes('studio-creator'));
    assert.ok(ids.some((id) => id.startsWith('studio-pack-')));
    assert.ok(ids.includes('marketplace-buyer'));
    assert.ok(ids.includes('marketplace-seller'));
    assert.ok(ids.includes('marketplace-plan-basic'));
    assert.ok(ids.includes('delivery-fee'));
    assert.equal(ids.includes('growth-free'), false);
    for (const row of rows) {
      assert.ok(row.affiliateCents >= 0);
      assert.equal(row.detailNl.some((line) => /12 maanden|kalenderjaar|365/.test(line)), false);
    }
  });

  it('sorts recurring first and highest commission by event amount', () => {
    const rows = buildAffiliateCommissionCatalog();
    const recurring = sortCatalog(rows, 'recurring');
    assert.equal(recurring[0].kind, 'recurring');
    const highest = sortCatalog(rows, 'commission');
    assert.ok(highest[0].affiliateCents >= highest[1].affiliateCents);
    const prices = sortCatalog(rows, 'price').filter((row) => row.customerPriceCents != null);
    assert.ok((prices[0].customerPriceCents ?? 0) <= (prices[1].customerPriceCents ?? 0));
    const growth = rows.filter((row) => row.platform === 'Growth');
    assert.ok(growth.every((row) => row.promo && row.network && row.kind === 'recurring'));
  });

  it('uses one Marketplace fee for the seller and the affiliate', () => {
    const sale = marketplaceSaleEconomics({
      saleCents: 10000,
      feePercent: PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT,
    });
    assert.equal(sale.platformFeeCents, calculatePlatformFeeCents(10000, 12));
    assert.equal(sale.sellerProceedsCents, 10000 - sale.platformFeeCents);
    assert.equal(sale.singleAffiliate.viewerCommissionCents, sale.singleAffiliate.poolCents);
    assert.equal(
      sale.twoAffiliates.viewerCommissionCents + sale.twoAffiliates.otherCommissionCents,
      sale.twoAffiliates.poolCents,
    );
    const examples = individualSaleExamples();
    assert.deepEqual(
      examples.map((row) => row.saleCents),
      [2500, 5000, 10000, 25000],
    );
  });

  it('persists a new-country request before email and ignores a duplicate', async () => {
    assert.equal(decideAffiliateMarket('NL'), 'SUPPORTED');
    assert.equal(decideAffiliateMarket('DE'), 'INTEREST');
    const created: string[] = [];
    const sent: string[] = [];
    const draft: MarketInterestDraft = {
      name: 'Ada',
      email: 'ada@example.com',
      countryCode: 'DE',
      countryName: 'Duitsland',
      region: null,
      phone: null,
      languages: null,
      profileUrl: null,
      salesExperience: null,
      networkReach: null,
      wantsOwnCustomers: true,
      wantsNetwork: false,
      motivation: null,
      locale: 'nl',
    };
    const store = {
      async findOpen() {
        return created.length
          ? { id: created[0], email: draft.email, countryCode: 'DE', status: 'NEW' }
          : null;
      },
      async create() {
        created.push('row-1');
        assert.equal(sent.length, 0);
        return { id: 'row-1', email: draft.email, countryCode: 'DE', status: 'NEW' };
      },
    };
    const first = await submitMarketInterest({
      draft,
      store,
      mailer: {
        async send(mail) {
          assert.equal(created.length, 1);
          sent.push(mail.subject);
        },
      },
    });
    assert.equal(first.ok && first.persistedBeforeEmail, true);
    assert.equal(sent.length, 2);
    const second = await submitMarketInterest({
      draft,
      store,
      mailer: { async send() { sent.push('should-not'); } },
    });
    assert.equal(second.ok && second.duplicate, true);
    assert.equal(sent.length, 2);
    const supported = await submitMarketInterest({
      draft: { ...draft, countryCode: 'NL' },
      store,
      mailer: { async send() { throw new Error('no'); } },
    });
    assert.equal(supported.ok, false);
  });

  it('keeps FAQ JSON-LD aligned and avoids the old duration contrast', () => {
    const faqs = affiliatePropositionFaqs('nl');
    const ld = getAffiliateLandingFaqJsonLd('nl') as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    assert.equal(ld.mainEntity.length, faqs.length);
    assert.equal(ld.mainEntity[0].name, faqs[0].q);
    const blob = JSON.stringify(ld);
    assert.equal(/kalenderjaar|12 maanden|365 dagen|oneindig|levenslang/i.test(blob), false);
    assert.match(blob, /2, 5 of 20 jaar/);
  });

  it('does not leave the generic portfolio section on the earn hub', () => {
    const hub = readFileSync(`${root}/components/verdien/VerdienHubPage.tsx`, 'utf8');
    const sources = readFileSync(`${root}/lib/i18n/verdienHubSources.ts`, 'utf8');
    assert.equal(hub.includes('copy.portfolio'), false);
    assert.equal(sources.includes('"Bouw je eigen klantenportefeuille"'), false);
    assert.match(sources, /Ontdek de affiliate-mogelijkheden/);
    const landing = readFileSync(
      `${root}/components/affiliate/AffiliateGrowthLanding.tsx`,
      'utf8',
    );
    assert.equal(landing.includes('€1,750'), false);
    assert.equal(landing.includes('€1,80'), false);
    const redirect = readFileSync(`${root}/next.config.mjs`, 'utf8');
    assert.match(redirect, /\/aviliate.*\/affiliate/s);
  });

  it('classifies the live network and does not change economics flags', () => {
    assert.equal(MAIN_SUB_HIERARCHY, 'LIVE');
    assert.equal(SELF_SERVICE_SUB_CREATION, 'LIVE');
    assert.equal(SUB_INVITE_FLOW, 'LIVE');
    assert.equal(NETWORK_DASHBOARD, 'LIVE');
  });
});
