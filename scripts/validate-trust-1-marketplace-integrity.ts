/**
 * TRUST-1 marketplace integrity validation.
 *   npx tsx scripts/validate-trust-1-marketplace-integrity.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MARKETPLACE_FIT_SCENARIOS } from '../lib/trust/marketplace-fit';
import {
  PRODUCT_INTEGRITY_REASONS,
  PRODUCT_INTEGRITY_REASON_COPY,
  isProductIntegrityReason,
} from '../lib/trust/integrity-reasons';
import {
  isIntegrityPubliclyDiscoverable,
  productIntegrityPublicWhere,
  statusAfterAdminRestore,
} from '../lib/trust/integrity-status';
import {
  aggregateIntegrityCredibility,
  computeReporterCredibilityWeight,
  shouldTemporarilyHideFromCredibility,
  INTEGRITY_HIDE_MIN_UNIQUE_REPORTERS,
} from '../lib/trust/credibility';
import {
  SELLER_CONTRIBUTION_TYPES,
  contributionDeclarationState,
  contributionRequiredForPublish,
  parseSellerContributionTypes,
  suggestedContributionTypes,
} from '../lib/trust/seller-contribution';

const ROOT = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// Spec scenarios 1–10
assert.equal(MARKETPLACE_FIT_SCENARIOS.length, 10);
assert.equal(
  MARKETPLACE_FIT_SCENARIOS.filter((s) => s.verdict === 'ALLOWED').length,
  8,
);
assert.equal(
  MARKETPLACE_FIT_SCENARIOS.filter((s) => s.verdict === 'NOT_HOMECHEFF_FIT')
    .length,
  2,
);

// Canonical reason present; deprecated self-made enum not used as reason id
{
  assert.ok(isProductIntegrityReason('NO_MEANINGFUL_SELLER_CONTRIBUTION'));
  assert.equal(
    PRODUCT_INTEGRITY_REASONS.includes('NO_MEANINGFUL_SELLER_CONTRIBUTION' as never),
    true,
  );
  assert.equal(
    (PRODUCT_INTEGRITY_REASONS as readonly string[]).includes('NOT_SELF_MADE'),
    false,
  );
  assert.match(
    PRODUCT_INTEGRITY_REASON_COPY.NO_MEANINGFUL_SELLER_CONTRIBUTION.labelNl,
    /wederverkoop/i,
  );
  const reasonsSrc = read('lib/trust/integrity-reasons.ts');
  assert.equal(
    /export const PRODUCT_INTEGRITY_REASONS[\s\S]*NOT_SELF_MADE/.test(reasonsSrc),
    false,
  );
}

// Legacy listing without contribution field → discoverable when ACTIVE
assert.equal(isIntegrityPubliclyDiscoverable('ACTIVE'), true);
assert.equal(isIntegrityPubliclyDiscoverable(undefined), true);
assert.equal(isIntegrityPubliclyDiscoverable('TEMPORARILY_HIDDEN'), false);
assert.equal(isIntegrityPubliclyDiscoverable('REMOVED'), false);
assert.equal(isIntegrityPubliclyDiscoverable('REVIEW_REQUIRED'), true);

// One malicious report cannot hide
{
  const now = new Date();
  const agg = aggregateIntegrityCredibility([
    {
      reporterId: 'r1',
      credibilityWeight: 1.25,
      reason: 'NO_MEANINGFUL_SELLER_CONTRIBUTION',
      createdAt: now,
    },
  ]);
  assert.equal(shouldTemporarilyHideFromCredibility(agg), false);
}

// Duplicate same account → uniqueReporters stays 1
{
  const now = new Date();
  const agg = aggregateIntegrityCredibility([
    {
      reporterId: 'r1',
      credibilityWeight: 1,
      reason: 'NO_MEANINGFUL_SELLER_CONTRIBUTION',
      createdAt: now,
    },
    {
      reporterId: 'r1',
      credibilityWeight: 1.25,
      reason: 'MISLEADING_OR_FALSE',
      createdAt: now,
    },
  ]);
  assert.equal(agg.uniqueReporters, 1);
  assert.equal(agg.weightSum, 1.25);
  assert.equal(shouldTemporarilyHideFromCredibility(agg), false);
}

// Credible threshold crossed
{
  const now = new Date();
  const reports = ['a', 'b', 'c'].map((id) => ({
    reporterId: id,
    credibilityWeight: 1.0,
    reason: 'NO_MEANINGFUL_SELLER_CONTRIBUTION',
    createdAt: now,
  }));
  const agg = aggregateIntegrityCredibility(reports);
  assert.equal(agg.uniqueReporters, INTEGRITY_HIDE_MIN_UNIQUE_REPORTERS);
  assert.ok(agg.weightSum >= 2.5);
  assert.equal(shouldTemporarilyHideFromCredibility(agg), true);
}

// New accounts weak weight
{
  const now = new Date();
  const w = computeReporterCredibilityWeight({
    accountCreatedAt: new Date(now.getTime() - 2 * 86400000),
    emailVerified: now,
    now,
  });
  assert.equal(w, 0.25);
}

// Restore does not imply isActive flip (documented by statusAfterAdminRestore)
assert.equal(statusAfterAdminRestore(), 'ACTIVE');

// Feed eligibility helper
assert.deepEqual(productIntegrityPublicWhere().integrityStatus.in, [
  'ACTIVE',
  'REVIEW_REQUIRED',
]);

// Feed file uses integrity where; GeoFeed composition not rewritten
{
  const feedQ = read('lib/feed/feed-product-query.server.ts');
  assert.match(feedQ, /productIntegrityPublicWhere/);
  assert.equal(feedQ.includes('endless'), false);
  // ensure not mutating CTA
  assert.equal(feedQ.includes('CTA'), false);
}

// Schema additive
{
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /integrityStatus/);
  assert.match(schema, /model ProductIntegrityReport/);
  assert.equal(schema.includes('NOT_SELF_MADE'), false);
  const mig = read(
    'prisma/migrations/20260814160000_trust1_product_integrity/migration.sql',
  );
  assert.match(mig, /ADD COLUMN IF NOT EXISTS "integrityStatus"/);
  assert.equal(mig.toLowerCase().includes('update "product" set'), false);
}

// No LEGAL-1/2 mutation
{
  const submit = read('lib/trust/submit-integrity-report.ts');
  assert.equal(submit.includes('commerceDeclaration'), false);
  assert.equal(submit.includes('allergensConfirmedAt'), false);
}

// TRUST-1.1 — seller contribution registry + publish policy + no feed cost
{
  assert.equal(SELLER_CONTRIBUTION_TYPES.includes('OWN_SERVICE'), true);
  assert.equal(SELLER_CONTRIBUTION_TYPES.includes('TRANSFORMED'), true);
  assert.equal(contributionDeclarationState([]), 'NOT_DECLARED');
  assert.equal(contributionDeclarationState(['MADE']), 'DECLARED');
  assert.equal(
    contributionRequiredForPublish({ listingIntent: 'OFFER', isEdit: false }),
    true,
  );
  assert.equal(
    contributionRequiredForPublish({ listingIntent: 'REQUEST', isEdit: false }),
    false,
  );
  assert.equal(
    contributionRequiredForPublish({
      listingIntent: 'OFFER',
      isEdit: true,
      integrityStatus: 'ACTIVE',
    }),
    false,
  );
  assert.equal(
    contributionRequiredForPublish({
      listingIntent: 'OFFER',
      isEdit: true,
      integrityStatus: 'TEMPORARILY_HIDDEN',
    }),
    true,
  );
  assert.deepEqual(suggestedContributionTypes({ marketplaceCategory: 'GROW' }), [
    'GROWN',
  ]);
  assert.deepEqual(
    suggestedContributionTypes({ marketplaceCategory: 'ARTISTIC_SERVICE' }),
    ['OWN_SERVICE'],
  );
  assert.deepEqual(parseSellerContributionTypes(['TRANSFORMED', 'bogus']), [
    'TRANSFORMED',
  ]);

  const schema = read('prisma/schema.prisma');
  assert.match(schema, /sellerContributionTypes/);
  assert.match(schema, /sellerContributionNote/);
  const mig11 = read(
    'prisma/migrations/20260815120000_trust11_seller_contribution/migration.sql',
  );
  assert.match(mig11, /sellerContributionTypes/);
  assert.equal(mig11.toLowerCase().includes('update "product" set'), false);
  assert.equal(/UPDATE\s+"Product"\s+SET/i.test(mig11), false);

  const feedQ = read('lib/feed/feed-product-query.server.ts');
  assert.equal(feedQ.includes('sellerContribution'), false);

  const clarify = read('lib/trust/seller-integrity-clarification.ts');
  assert.match(clarify, /SELLER_CLARIFICATION/);
  assert.equal(clarify.includes('isActive: true'), false);
  assert.equal(clarify.includes("integrityStatus: 'ACTIVE'"), false);

  const admin = read('lib/trust/admin-integrity-actions.ts');
  assert.match(admin, /adminRequestContributionChanges/);
  assert.match(admin, /sellerIsActiveUnchanged/);

  // Threshold frozen
  assert.equal(INTEGRITY_HIDE_MIN_UNIQUE_REPORTERS, 3);
  const cred = read('lib/trust/credibility.ts');
  assert.match(cred, /INTEGRITY_HIDE_MIN_WEIGHT_SUM = 2\.5/);

  // UI wiring present (no dead control markers)
  assert.match(
    read('components/trust/SellerContributionSelector.tsx'),
    /data-hc-seller-contribution/,
  );
  assert.match(
    read('components/trust/ProductIntegrityUnavailable.tsx'),
    /data-hc-integrity-clarify-submit/,
  );
  assert.match(
    read('components/admin/IntegrityQueuePanel.tsx'),
    /data-hc-integrity-request-changes/,
  );
  assert.match(
    read('components/products/marketplace/MarketplaceOfferForm.tsx'),
    /SellerContributionSelector/,
  );
  assert.equal(
    read('lib/trust/seller-contribution.ts').includes('commerceDeclaration'),
    false,
  );
  assert.equal(
    read('lib/trust/seller-contribution.ts').includes('allergensConfirmed'),
    false,
  );
}

console.log('TRUST-1 / TRUST-1.1 marketplace integrity validation: OK');
