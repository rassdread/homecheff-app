/**
 * LEGAL-4A compliance foundation validation.
 *   npx tsx scripts/validate-legal-4a-compliance-foundation.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  COMPLIANCE_AXES,
  FORBIDDEN_COMPLIANCE_MEGA_FLAGS,
} from '../lib/compliance/axes';
import {
  DSA_APPLICABILITY_STATES,
  article30OnboardingRequired,
  parseDsaApplicabilityState,
} from '../lib/compliance/dsa-applicability';
import {
  classifyDac7ActivityFromMarketplaceCategory,
  goodsThresholdAppliesToCategory,
} from '../lib/compliance/dac7-activity';
import {
  buildGoodsYearTotals,
  isExcludedGoodsSeller,
  DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE,
  DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE,
} from '../lib/compliance/dac7-threshold';
import { reconcileRefundState } from '../lib/compliance/refund-reconciliation';
import {
  classifyBarterOpennessForDac7,
  classifyPriceModelForDac7,
} from '../lib/compliance/dac7-consideration-kinds';
import { resolveDac7SellerReadiness } from '../lib/compliance/dac7-readiness';
import { assessIdentityReadiness } from '../lib/compliance/identity-readiness';
import { canSetBusinessVerified } from '../lib/compliance/business-verified';
import { assessArticle30ExistingCoverage } from '../lib/compliance/article30-existing-coverage';
import {
  complianceNotificationsEnabledForSend,
  PREPARED_COMPLIANCE_NOTIFICATION_TYPES,
} from '../lib/compliance/notification-prep';

const ROOT = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// --- Axes contract ---
assert.equal(COMPLIANCE_AXES.length, 8);
assert.ok(FORBIDDEN_COMPLIANCE_MEGA_FLAGS.includes('isCompliant'));

// --- DSA gate ---
assert.deepEqual(
  [...DSA_APPLICABILITY_STATES],
  [
    'NOT_ASSESSED',
    'SME_EXCLUSION_EXPECTED',
    'ARTICLE_30_APPLIES',
    'COUNSEL_REVIEW_REQUIRED',
  ],
);
assert.equal(article30OnboardingRequired('SME_EXCLUSION_EXPECTED'), false);
assert.equal(article30OnboardingRequired('ARTICLE_30_APPLIES'), true);
assert.equal(parseDsaApplicabilityState('NOPE'), 'NOT_ASSESSED');
assert.equal(
  assessArticle30ExistingCoverage('SME_EXCLUSION_EXPECTED', {
    name: 'A',
    email: 'a@b.c',
  }).onboardingRequired,
  false,
);

// --- Activity mapping ---
assert.equal(
  classifyDac7ActivityFromMarketplaceCategory('CREATE'),
  'GOODS',
);
assert.equal(
  classifyDac7ActivityFromMarketplaceCategory('GROW'),
  'GOODS',
);
assert.equal(
  classifyDac7ActivityFromMarketplaceCategory('ARTISTIC_SERVICE'),
  'PERSONAL_SERVICE',
);
assert.equal(
  classifyDac7ActivityFromMarketplaceCategory('PRACTICAL_SERVICE'),
  'PERSONAL_SERVICE',
);
assert.equal(
  classifyDac7ActivityFromMarketplaceCategory('KNOWLEDGE'),
  'PERSONAL_SERVICE',
);
assert.equal(
  classifyDac7ActivityFromMarketplaceCategory('DESIGN'),
  'OTHER_NON_REPORTABLE_OR_REVIEW',
);
assert.equal(goodsThresholdAppliesToCategory('PERSONAL_SERVICE'), false);
assert.equal(goodsThresholdAppliesToCategory('GOODS'), true);

// --- Goods threshold: BOTH conditions ---
assert.equal(
  isExcludedGoodsSeller({ transactionCount: 1, netConsiderationCents: 100 }),
  true,
);
assert.equal(
  isExcludedGoodsSeller({
    transactionCount: 29,
    netConsiderationCents: DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE,
  }),
  true,
);
assert.equal(
  isExcludedGoodsSeller({
    transactionCount: 30,
    netConsiderationCents: 100,
  }),
  false,
);
assert.equal(
  isExcludedGoodsSeller({
    transactionCount: 1,
    netConsiderationCents: DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE + 1,
  }),
  false,
);
assert.equal(DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE, 30);

const totals29 = buildGoodsYearTotals({
  year: 2026,
  transactionCount: 29,
  grossConsiderationCents: 150_000,
  refundCents: 0,
  platformFeesCents: 1000,
});
assert.equal(totals29.netConsiderationCents, 150_000);
assert.equal(isExcludedGoodsSeller(totals29), true);

// Personal service with many txs must NOT use goods exclusion path via readiness
assert.equal(
  resolveDac7SellerReadiness({
    primaryActivity: 'PERSONAL_SERVICE',
    goodsTotals: {
      year: 2026,
      transactionCount: 1,
      grossConsiderationCents: 100,
      refundCents: 0,
      netConsiderationCents: 100,
      platformFeesCents: 0,
    },
    hasAmbiguousActivity: false,
    hasBarterWithoutCounselRule: false,
    identityCompletenessScore: 0.8,
  }),
  'POTENTIALLY_REPORTABLE',
);

assert.equal(
  resolveDac7SellerReadiness({
    primaryActivity: 'GOODS',
    goodsTotals: totals29,
    hasAmbiguousActivity: false,
    hasBarterWithoutCounselRule: false,
    identityCompletenessScore: 0.8,
  }),
  'EXCLUDED_GOODS_SELLER',
);

// --- Refunds ---
assert.equal(
  reconcileRefundState([
    { amountCents: 1000, status: 'CAPTURED', refundCentsLinked: 0 },
  ]).state,
  'RECONCILED',
);
assert.equal(
  reconcileRefundState([
    { amountCents: 1000, status: 'CAPTURED', refundCentsLinked: 400 },
  ]).state,
  'PARTIAL',
);
assert.equal(
  reconcileRefundState([
    { amountCents: 1000, status: 'REFUNDED', refundCentsLinked: 0 },
  ]).state,
  'REVIEW_REQUIRED',
);

// --- Free / voluntary / barter ---
assert.equal(
  classifyPriceModelForDac7({
    priceModel: 'VOLUNTARY',
    priceCents: 0,
    hasCapturedMoney: false,
  }),
  'FREE_OR_ZERO',
);
assert.equal(
  classifyPriceModelForDac7({
    priceCents: 0,
    hasCapturedMoney: false,
  }),
  'FREE_OR_ZERO',
);
assert.equal(
  classifyBarterOpennessForDac7('BARTER_ONLY', false).barterLeg,
  'COUNSEL_REQUIRED_FOR_DAC7_VALUATION',
);
assert.equal(
  classifyBarterOpennessForDac7('MONEY_AND_BARTER', true).moneyLeg,
  'MONETARY_CAPTURED',
);
assert.equal(
  classifyBarterOpennessForDac7('MONEY_AND_BARTER', true).barterLeg,
  'COUNSEL_REQUIRED_FOR_DAC7_VALUATION',
);

// Unpaid proposal / deal lifecycle
assert.equal(
  classifyPriceModelForDac7({
    priceModel: 'FIXED',
    priceCents: 2500,
    hasCapturedMoney: false,
  }),
  'UNPAID_DEAL_LIFECYCLE',
);

// --- Identity / Business.verified ---
const id = assessIdentityReadiness({
  name: 'Ada',
  email: 'ada@example.com',
});
assert.ok(id.counselRequiredFields.includes('BSN'));
assert.ok(id.counselRequiredFields.includes('TIN'));
assert.equal(canSetBusinessVerified({ adminAttested: false, note: 'x' }).ok, false);
assert.equal(
  canSetBusinessVerified({
    adminAttested: true,
    note: 'KvK registry checked manually',
  }).ok,
  true,
);

// --- Notifications prepared but not sent ---
assert.equal(PREPARED_COMPLIANCE_NOTIFICATION_TYPES.length, 3);
assert.equal(complianceNotificationsEnabledForSend(), false);

// --- File / freeze checks ---
const schema = read('prisma/schema.prisma');
assert.ok(schema.includes('model CompliancePlatformAssessment'));
assert.ok(schema.includes('verifiedNote'));
assert.ok(!schema.includes('isCompliant'));
assert.ok(!schema.includes('dac7IsTaxable'));

const axesSrc = read('lib/compliance/axes.ts');
assert.ok(axesSrc.includes('DSA_APPLICABILITY'));
assert.ok(axesSrc.includes('DAC7_REPORTING_READINESS'));

const api = read('app/api/admin/compliance/route.ts');
assert.ok(api.includes('set_dsa_applicability'));
assert.ok(api.includes('set_business_verified'));

const panel = read('components/admin/ComplianceFoundationPanel.tsx');
assert.ok(panel.includes('LEGAL-4A'));

const fin = read('components/admin/FinancialManagement.tsx');
assert.ok(fin.includes('ComplianceFoundationPanel'));
assert.ok(fin.includes("id: 'compliance'"));

// No seller tax onboarding in create listing flows from this phase
const listingCreateCandidates = [
  'components/products/ProductForm.tsx',
  'app/sell/page.tsx',
  'components/marketplace/CreateListingForm.tsx',
].filter((p) => fs.existsSync(path.join(ROOT, p)));
for (const rel of listingCreateCandidates) {
  const src = read(rel);
  assert.ok(!src.includes('DAC7_INFORMATION_REQUIRED'));
  assert.ok(!src.includes('You owe tax'));
}

// Terms / Privacy / Stripe architecture unchanged by LEGAL-4A libs
const termsHint = read('lib/legal/document-versions.ts');
assert.ok(termsHint.includes('TERMS_VERSION'));
// LEGAL-4A must not bump terms for payment-role
assert.ok(!read('lib/compliance/dsa-applicability.ts').includes('TERMS_VERSION'));

const audit = read('docs/audits/legal-4a-compliance-foundation.md');
assert.ok(audit.includes('ALREADY BUILT'));
assert.ok(audit.includes('COUNSEL_REQUIRED'));
assert.ok(audit.includes('PAYMENT ROLE UNCHANGED'));

const smeDoc = read('docs/audits/legal-4a-dsa-sme-article29-evidence.md');
assert.ok(smeDoc.includes('Article 29'));
assert.ok(smeDoc.includes('12-month'));
assert.ok(!smeDoc.toLowerCase().includes('exempt forever'));

// No second ledgers
assert.ok(!schema.includes('model Dac7TransactionLedger'));
assert.ok(!schema.includes('model SecondSellerIdentity'));

console.log('LEGAL-4A validation OK');
console.log(
  JSON.stringify(
    {
      dsaStates: DSA_APPLICABILITY_STATES.length,
      goodsTxnCap: DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE,
      goodsEurCapCents: DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE,
      notificationsArmed: complianceNotificationsEnabledForSend(),
      article30OnSmeExclusion: article30OnboardingRequired(
        'SME_EXCLUSION_EXPECTED',
      ),
    },
    null,
    2,
  ),
);
