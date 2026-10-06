/**
 * Public business-plan facts must match the live price, fee and affiliate engines.
 * Run: npx tsx scripts/test-business-plan-presentation.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getBusinessVisibilityProfile } from '../lib/business/visibility-profile';
import { SPONSORED_DISTRIBUTION_WEIGHT } from '../lib/sponsored/recommendation';
import {
  affiliateRewardsForPlans,
  businessPlanFaq,
  businessPlanJsonLd,
  commissionOffsetSalesCents,
  publicPlanFacts,
} from '../lib/business/plan-presentation';
import {
  buildSubscriptionComparisonRows,
  growthBenefitKeysForPlan,
} from '../lib/business/subscription-comparison';
import { buildLivePreviewFields, computeUpgradeDelta } from '../lib/business/dna-preview';

const nl = publicPlanFacts('nl');
const en = publicPlanFacts('en');
for (const fact of nl) {
  const profile = getBusinessVisibilityProfile(fact.id);
  assert.equal(fact.priceCents, profile.monthlyPriceCents);
  assert.equal(fact.commissionPercent, profile.commissionPercent);
  const twin = en.find((row) => row.id === fact.id);
  assert.equal(twin?.priceCents, fact.priceCents);
  assert.equal(twin?.commissionPercent, fact.commissionPercent);
}
assert.equal(nl.find((row) => row.id === 'basic')?.priceCents, 3900);
assert.equal(nl.find((row) => row.id === 'pro')?.priceCents, 9900);
assert.equal(nl.find((row) => row.id === 'premium')?.priceCents, 19900);
assert.equal(nl.find((row) => row.id === 'individual')?.commissionPercent, 12);
assert.equal(SPONSORED_DISTRIBUTION_WEIGHT.basic, 1);
assert.equal(SPONSORED_DISTRIBUTION_WEIGHT.pro, 2);
assert.equal(SPONSORED_DISTRIBUTION_WEIGHT.premium, 3);

const rewards = affiliateRewardsForPlans();
assert.equal(rewards.find((row) => row.plan === 'basic')?.directCents, 1950);
assert.equal(rewards.find((row) => row.plan === 'pro')?.directCents, 4950);
assert.equal(rewards.find((row) => row.plan === 'premium')?.directCents, 9950);
assert.equal(rewards.find((row) => row.plan === 'basic')?.partnerCents, 1560);
assert.equal(rewards.find((row) => row.plan === 'basic')?.mainCents, 390);
assert.equal(commissionOffsetSalesCents('basic'), 130000);

const faq = businessPlanFaq('nl').map((item) => `${item.question} ${item.answer}`).join('\n').replace(/\u00a0/g, '');
assert.match(faq, /€39/);
assert.match(faq, /9%/);
assert.match(faq, /€99/);
assert.match(faq, /7%/);
assert.match(faq, /€199/);
assert.match(faq, /5%/);
assert.match(faq, /niet te koop/);
assert.match(faq, /geen beloofd aantal/);
assert.match(faq, /€19,50/);
assert.equal(/2×|3×|gegarandeerde vertoning/i.test(faq), false);

const json = JSON.stringify(businessPlanJsonLd('nl'));
assert.match(json, /"price":"39"/);
assert.match(json, /"price":"99"/);
assert.match(json, /"price":"199"/);
assert.equal(json.includes('AggregateRating'), false);

const rows = buildSubscriptionComparisonRows();
assert.deepEqual(rows.map((row) => row.featureKey), [
  'business.dna.compare.commission',
  'business.dna.compare.sponsored',
]);
for (const plan of ['individual', 'basic', 'pro', 'premium'] as const) {
  const joined = [
    ...growthBenefitKeysForPlan(plan),
    ...buildLivePreviewFields(plan).map((field) => field.labelKey),
    ...computeUpgradeDelta('individual', plan).map((item) => item.key),
  ].join('\n');
  assert.equal(/homepage|regional/i.test(joined), false, plan);
}
assert.ok(growthBenefitKeysForPlan('basic').includes('business.dna.benefit.sponsoredBasic'));

const nlCopy = readFileSync(new URL('../public/i18n/nl.json', import.meta.url), 'utf8');
const enCopy = readFileSync(new URL('../public/i18n/en.json', import.meta.url), 'utf8');
assert.equal(/homepage spotlight/i.test(nlCopy), false);
assert.equal(/homepage spotlight/i.test(enCopy), false);
assert.equal(/regionale zichtbaarheid/i.test(nlCopy), false);
assert.equal(/regional visibility/i.test(enCopy), false);

const sell = readFileSync(new URL('../app/sell/page.tsx', import.meta.url), 'utf8');
assert.equal(sell.includes("'use client'"), false);
const sitemap = readFileSync(new URL('../lib/seo/sitemapXml.ts', import.meta.url), 'utf8');
assert.match(sitemap, /"\/sell"/);
JSON.parse(readFileSync(new URL('../public/i18n/nl.json', import.meta.url), 'utf8'));
JSON.parse(readFileSync(new URL('../public/i18n/en.json', import.meta.url), 'utf8'));
console.log('business plan presentation checks passed');
