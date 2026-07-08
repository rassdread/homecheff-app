#!/usr/bin/env npx tsx
/**
 * Phase 10E — Production canonical backfill audit (read-only).
 *
 * Reuses Phase 10C SSOT only — no duplicate normalization logic.
 *
 * Run:
 *   npx tsx scripts/audit-production-backfill-phase10e.ts
 *   DATABASE_URL=... npx tsx scripts/audit-production-backfill-phase10e.ts --json
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  applyProposalUpdates,
  verifyAllProposalsSafe,
} from '@/lib/marketplace/normalization/backfill-safety';
import {
  hasWritableUpdates,
  isProductCanonical,
  proposeProductNormalization,
  type ProductNormalizationRecord,
} from '@/lib/marketplace/normalization/propose-product-normalization';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { isPendingAcceptedValueId } from '@/lib/marketplace/pending-accepted-values/constants';
import { isRequestListing } from '@/lib/marketplace/product-visibility';
import { isMarketplaceServiceItem } from '@/lib/feed/marketplace-sale';

const root = resolve(import.meta.dirname ?? __dirname, '..');
process.chdir(root);

const SERVICE_KINDS = new Set([
  'SERVICE',
  'TASK',
  'WORKSHOP',
  'COACHING',
]);

function loadEnvLocal() {
  const p = resolve(root, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const prisma = new PrismaClient();
const jsonStdout = process.argv.includes('--json');
const started = Date.now();

const PRODUCT_SELECT = {
  id: true,
  title: true,
  category: true,
  listingIntent: true,
  marketplaceCategory: true,
  subcategory: true,
  specializations: true,
  acceptedSpecializations: true,
  barterOpenness: true,
  priceModel: true,
  priceCents: true,
  orderMethod: true,
  acceptHomeCheffPayment: true,
  acceptDirectContact: true,
  isActive: true,
  createdAt: true,
  seller: {
    select: {
      User: {
        select: {
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      },
    },
  },
} as const;

function toRecord(
  row: Awaited<ReturnType<typeof prisma.product.findMany>>[number],
  stripeReady: boolean,
): ProductNormalizationRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    listingIntent: row.listingIntent,
    marketplaceCategory: row.marketplaceCategory,
    subcategory: row.subcategory,
    specializations: row.specializations,
    acceptedSpecializations: row.acceptedSpecializations,
    barterOpenness: row.barterOpenness,
    priceModel: row.priceModel,
    priceCents: row.priceCents,
    orderMethod: row.orderMethod,
    acceptHomeCheffPayment: row.acceptHomeCheffPayment,
    acceptDirectContact: row.acceptDirectContact,
    isActive: row.isActive,
    createdAt: row.createdAt,
    sellerStripeConnectReady: stripeReady,
  };
}

function kindInputFromRecord(record: ProductNormalizationRecord) {
  return {
    entityType: 'product' as const,
    listingIntent: record.listingIntent,
    marketplaceCategory: record.marketplaceCategory,
    specializations: record.specializations,
    subcategory: record.subcategory,
    category: record.category,
  };
}

async function main() {
  console.log('=== Phase 10E — Production backfill audit ===\n');
  const dbUrl = process.env.DATABASE_URL ?? '';
  const envHint = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
    ? 'local'
    : dbUrl
      ? 'remote'
      : 'unknown';
  console.log(`Database target: ${envHint}\n`);

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    select: PRODUCT_SELECT,
  });

  const dishCount = await prisma.dish.count();
  const legacyListingCount = await prisma.listing.count();

  let canonicalRows = 0;
  let requiringUpdates = 0;
  let skipped = 0;
  let manualReview = 0;
  let requests = 0;
  let services = 0;
  let pendingAcceptedValueRows = 0;
  let stripeWarnings = 0;
  let categoryMismatches = 0;
  let listingKindDrift = 0;
  let acceptedValueIssues = 0;
  let settlementInconsistencies = 0;
  let unknownTaxonomyRows = 0;

  const issueCounts: Record<string, number> = {};
  const unmappedSpecs = new Set<string>();
  const unmappedAccepted = new Set<string>();
  const writableProposals: Array<{
    productId: string;
    title: string;
    issues: string[];
    risks: string[];
    updates: Record<string, unknown>;
    derived: Record<string, unknown>;
    why: string[];
  }> = [];
  const manualReviewRows: Array<{ productId: string; title: string; reasons: string[] }> =
    [];

  const safetyPairs: Array<{
    before: ProductNormalizationRecord;
    proposal: ReturnType<typeof proposeProductNormalization>;
  }> = [];

  for (const row of products) {
    const stripeReady = !!(
      row.seller?.User?.stripeConnectAccountId &&
      row.seller?.User?.stripeConnectOnboardingCompleted
    );
    const record = toRecord(row, stripeReady);
    const proposal = proposeProductNormalization(record);
    safetyPairs.push({ before: record, proposal });

    if (isRequestListing(record)) requests += 1;
    if (
      isMarketplaceServiceItem({
        id: record.id,
        listingIntent: record.listingIntent,
        listingKind: proposal.derived.listingKind,
        priceCents: record.priceCents,
        priceModel: record.priceModel,
        feedSource: 'PRODUCT',
      })
    ) {
      services += 1;
    }

    if (record.acceptedSpecializations.some(isPendingAcceptedValueId)) {
      pendingAcceptedValueRows += 1;
    }

    for (const issue of proposal.issues) {
      issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
    }
    proposal.unmappedSpecializations.forEach((v) => unmappedSpecs.add(v));
    proposal.unmappedAcceptedValues.forEach((v) => unmappedAccepted.add(v));

    if (proposal.issues.includes('checkout_needs_stripe_connect')) stripeWarnings += 1;
    if (
      proposal.issues.includes('category_spec_mismatch') ||
      proposal.issues.includes('service_misclassified_category') ||
      proposal.issues.includes('legacy_category_mismatch')
    ) {
      categoryMismatches += 1;
    }
    if (
      proposal.issues.includes('stale_accepted_values') ||
      proposal.issues.includes('unmapped_accepted_values')
    ) {
      acceptedValueIssues += 1;
    }
    if (
      proposal.issues.includes('settlement_contact_order_method_mismatch') ||
      proposal.issues.includes('missing_settlement_path')
    ) {
      settlementInconsistencies += 1;
    }
    if (proposal.unmappedSpecializations.length > 0) unknownTaxonomyRows += 1;

    const beforeKind = deriveListingKind(kindInputFromRecord(record)).listingKind;
    const afterRecord = applyProposalUpdates(record, proposal);
    const afterKind = deriveListingKind(kindInputFromRecord(afterRecord)).listingKind;
    if (beforeKind !== afterKind && hasWritableUpdates(proposal)) {
      listingKindDrift += 1;
    }

    if (isProductCanonical(proposal)) {
      canonicalRows += 1;
    } else if (hasWritableUpdates(proposal)) {
      requiringUpdates += 1;
      const why: string[] = [];
      for (const issue of proposal.issues) {
        if (issue !== 'checkout_needs_stripe_connect') why.push(issue);
      }
      writableProposals.push({
        productId: proposal.productId,
        title: proposal.title,
        issues: proposal.issues,
        risks: proposal.risks,
        updates: proposal.updates,
        derived: proposal.derived,
        why,
      });
    } else {
      skipped += 1;
    }

    const needsManual =
      proposal.unmappedSpecializations.length > 0 ||
      proposal.unmappedAcceptedValues.length > 0 ||
      (proposal.issues.includes('checkout_needs_stripe_connect') &&
        proposal.issues.length > 1);
    if (needsManual) {
      manualReview += 1;
      manualReviewRows.push({
        productId: proposal.productId,
        title: proposal.title,
        reasons: [
          ...proposal.unmappedSpecializations.map((s) => `unmapped_spec:${s}`),
          ...proposal.unmappedAcceptedValues.map((s) => `unmapped_accepted:${s}`),
          ...(proposal.issues.includes('checkout_needs_stripe_connect')
            ? ['checkout_needs_stripe_connect']
            : []),
        ],
      });
    }
  }

  const safety = verifyAllProposalsSafe(safetyPairs);
  const elapsedMs = Date.now() - started;

  const report = {
    phase: '10E',
    generatedAt: new Date().toISOString(),
    executionMs: elapsedMs,
    databaseTarget: envHint,
    migrationSsot: {
      proposal: 'lib/marketplace/normalization/propose-product-normalization.ts',
      audit: 'scripts/audit-marketplace-data-normalization-phase10c.ts',
      backfill: 'scripts/backfill-marketplace-data-normalization-phase10c.ts',
    },
    totals: {
      products: products.length,
      requests,
      services,
      dishes: dishCount,
      legacyListings: legacyListingCount,
      canonicalRows,
      requiringUpdates,
      skipped,
      manualReview,
      unknownTaxonomyRows,
      pendingAcceptedValueRows,
      stripeConnectWarnings: stripeWarnings,
      categoryMismatches,
      listingKindDrift,
      acceptedValueIssues,
      settlementInconsistencies,
    },
    issueCounts,
    unmappedSpecializations: [...unmappedSpecs].sort(),
    unmappedAcceptedValues: [...unmappedAccepted].sort(),
    safetyVerification: safety,
    writableProposals,
    manualReviewRows,
    dryRunCommand:
      'npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run',
    writeCommand:
      'CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write',
    postWriteAuditCommand:
      'npx tsx scripts/audit-production-backfill-phase10e.ts',
  };

  const outPath = resolve(
    root,
    'docs/audits/phase10e-production-backfill-audit-latest.json',
  );
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('Part 2 — Production audit');
  console.log(`  Total Products:              ${report.totals.products}`);
  console.log(`  Total Requests:              ${report.totals.requests}`);
  console.log(`  Total Services:              ${report.totals.services}`);
  console.log(`  Legacy listings:             ${report.totals.legacyListings}`);
  console.log(`  Canonical rows:              ${report.totals.canonicalRows}`);
  console.log(`  Rows requiring updates:      ${report.totals.requiringUpdates}`);
  console.log(`  Rows skipped (audit-only):   ${report.totals.skipped}`);
  console.log(`  Manual review:               ${report.totals.manualReview}`);
  console.log(`  Unknown taxonomy rows:       ${report.totals.unknownTaxonomyRows}`);
  console.log(`  Pending accepted-value rows: ${report.totals.pendingAcceptedValueRows}`);
  console.log(`  Settlement inconsistencies:  ${report.totals.settlementInconsistencies}`);
  console.log(`  Stripe Connect warnings:     ${report.totals.stripeConnectWarnings}`);
  console.log(`  Category mismatches:         ${report.totals.categoryMismatches}`);
  console.log(`  ListingKind drift (if write):${report.totals.listingKindDrift}`);

  console.log('\nPart 4 — Safety verification');
  console.log(
    safety.safe
      ? '  ✅ All writable proposals pass safety checks'
      : `  ❌ ${safety.violations.length} safety violation(s)`,
  );
  if (!safety.safe) {
    for (const v of safety.violations.slice(0, 10)) {
      console.log(`    - ${v}`);
    }
  }

  console.log(`\nWrote ${outPath}`);
  console.log(`Execution time: ${elapsedMs}ms`);

  if (jsonStdout) {
    console.log(JSON.stringify(report, null, 2));
  }

  if (!safety.safe) process.exit(1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
