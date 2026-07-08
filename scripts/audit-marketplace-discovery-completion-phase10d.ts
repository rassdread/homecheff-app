#!/usr/bin/env npx tsx
/**
 * Phase 10D — Marketplace discovery completion audit (read-only).
 *
 * Run: npx tsx scripts/audit-marketplace-discovery-completion-phase10d.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  isProductCanonical,
  proposeProductNormalization,
} from '@/lib/marketplace/normalization/propose-product-normalization';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { itemMatchesAcceptedValuesDiscoveryFilter } from '@/lib/marketplace/discovery/accepted-values-discovery';
import { getAcceptedValueTaxonomyItems } from '@/lib/marketplace/taxonomy-resolve';

const root = resolve(import.meta.dirname ?? __dirname, '..');
process.chdir(root);

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

const REVERSE_DISCOVERY_SCENARIOS = [
  { label: 'fruit', id: 'grow.fruit' },
  { label: 'photography', id: 'design.photo' },
  { label: 'nail styling', id: 'artistic.nails' },
  { label: 'transport', id: 'practical.movinghelp' },
  { label: 'coaching', id: 'knowledge.coaching' },
  { label: 'gardening', id: 'practical.gardenwork' },
  { label: 'labour', id: 'practical.handyman' },
] as const;

async function main() {
  console.log('=== Phase 10D — Discovery completion audit ===\n');

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
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
    },
  });

  const dishCount = await prisma.dish.count();
  const listingCount = await prisma.listing.count();

  let canonical = 0;
  let needsBackfill = 0;
  let auditOnly = 0;
  const issueCounts: Record<string, number> = {};
  const unmappedSpecs = new Set<string>();
  const unmappedAccepted = new Set<string>();

  for (const row of products) {
    const stripeReady = !!(
      row.seller?.User?.stripeConnectAccountId &&
      row.seller?.User?.stripeConnectOnboardingCompleted
    );
    const proposal = proposeProductNormalization({
      ...row,
      sellerStripeConnectReady: stripeReady,
    });
    if (isProductCanonical(proposal)) canonical += 1;
    else if (Object.keys(proposal.updates).length > 0) needsBackfill += 1;
    else auditOnly += 1;
    for (const issue of proposal.issues) {
      issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
    }
    proposal.unmappedSpecializations.forEach((v) => unmappedSpecs.add(v));
    proposal.unmappedAcceptedValues.forEach((v) => unmappedAccepted.add(v));
  }

  const acceptedItems = getAcceptedValueTaxonomyItems();
  const reverseDiscovery: Array<{
    scenario: string;
    taxonomyId: string;
    taxonomyExists: boolean;
    productsAccepting: number;
  }> = [];

  for (const scenario of REVERSE_DISCOVERY_SCENARIOS) {
    const exists = acceptedItems.some((i) => i.id === scenario.id);
    let accepting = 0;
    for (const row of products) {
      if (
        itemMatchesAcceptedValuesDiscoveryFilter(
          { acceptedSpecializations: row.acceptedSpecializations },
          [scenario.id],
        )
      ) {
        accepting += 1;
      }
    }
    reverseDiscovery.push({
      scenario: scenario.label,
      taxonomyId: scenario.id,
      taxonomyExists: exists,
      productsAccepting: accepting,
    });
  }

  const derivedKinds: Record<string, number> = {};
  for (const row of products) {
    const kind = deriveListingKind({
      listingIntent: row.listingIntent,
      marketplaceCategory: row.marketplaceCategory,
      specializations: row.specializations,
      subcategory: row.subcategory,
      priceCents: row.priceCents,
      priceModel: row.priceModel,
    }).listingKind;
    derivedKinds[kind] = (derivedKinds[kind] ?? 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    data: {
      products: products.length,
      dishes: dishCount,
      legacyListings: listingCount,
      fullyCanonical: canonical,
      needsBackfill,
      auditOnlyIssues: auditOnly,
      issueCounts,
      unmappedSpecializations: [...unmappedSpecs],
      unmappedAcceptedValues: [...unmappedAccepted],
      derivedListingKinds: derivedKinds,
    },
    reverseDiscovery,
    filterPersistence: {
      homeSurfaceKey: 'hc_feed_surfaces_v2',
      persistedFields: [
        'feedChip',
        'category',
        'scope',
        'radius',
        'sortBy',
        'sortOrder',
        'searchQuery',
        'q',
        'place',
        'priceMin',
        'priceMax',
        'showFilters',
        'discoveryDirection',
        'acceptedValues',
      ],
      ssot: 'lib/feed/home-filter-persist.ts',
    },
    deferred: [
      'Dorpsplein/Inspiratie parallel filter stacks (separate surfaces)',
      'Server-side vertical=services Prisma filter',
      'URL params for accepted values / discovery direction',
    ],
  };

  const outPath = resolve(
    root,
    'docs/audits/phase10d-discovery-completion-audit-latest.json',
  );
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('Part 1 — Data consistency');
  console.log(`  Products:          ${products.length}`);
  console.log(`  Fully canonical:   ${canonical}`);
  console.log(`  Needs backfill:    ${needsBackfill}`);
  console.log(`  Audit-only:        ${auditOnly}`);
  if (Object.keys(issueCounts).length > 0) {
    console.log('\n  Issue breakdown:');
    for (const [k, v] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${k}: ${v}`);
    }
  }

  console.log('\nPart 6 — Reverse discovery scenarios');
  for (const row of reverseDiscovery) {
    const status = row.taxonomyExists ? '✓' : '✗ taxonomy';
    console.log(
      `  ${row.scenario.padEnd(14)} ${status} — ${row.productsAccepting} product(s) accept ${row.taxonomyId}`,
    );
  }

  console.log('\nPart 9 — Filter persistence');
  console.log('  discoveryDirection + acceptedValues now in hc_feed_surfaces_v2');

  console.log(`\nWrote ${outPath}`);
  console.log('\nNext: npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
