#!/usr/bin/env npx tsx
/**
 * Phase 10C — Marketplace data normalization audit (read-only).
 *
 * Run: npx tsx scripts/audit-marketplace-data-normalization-phase10c.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  isProductCanonical,
  proposeProductNormalization,
  type ProductNormalizationProposal,
} from '@/lib/marketplace/normalization/propose-product-normalization';

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
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
const jsonOut = process.argv.includes('--json');

type IssueCounts = Record<string, number>;

function bump(map: IssueCounts, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

async function main() {
  console.log('=== Phase 10C — Marketplace data normalization audit ===\n');

  const products = await prisma.product.findMany({
    take: limit ?? undefined,
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

  const proposals: ProductNormalizationProposal[] = [];
  const issueCounts: IssueCounts = {};
  const unmappedSpecs = new Set<string>();
  const unmappedAccepted = new Set<string>();
  let canonical = 0;
  let needsBackfill = 0;
  let auditOnly = 0;

  for (const row of products) {
    const stripeReady = !!(
      row.seller?.User?.stripeConnectAccountId &&
      row.seller?.User?.stripeConnectOnboardingCompleted
    );
    const proposal = proposeProductNormalization({
      ...row,
      barterOpenness: row.barterOpenness,
      sellerStripeConnectReady: stripeReady,
    });
    proposals.push(proposal);
    if (isProductCanonical(proposal)) {
      canonical += 1;
    } else if (Object.keys(proposal.updates).length > 0) {
      needsBackfill += 1;
    } else {
      auditOnly += 1;
    }
    for (const issue of proposal.issues) bump(issueCounts, issue);
    proposal.unmappedSpecializations.forEach((v) => unmappedSpecs.add(v));
    proposal.unmappedAcceptedValues.forEach((v) => unmappedAccepted.add(v));
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totals: {
      products: products.length,
      dishes: dishCount,
      legacyListings: listingCount,
      fullyCanonical: canonical,
      needsBackfill,
      auditOnlyIssues: auditOnly,
    },
    issueCounts,
    unmappedSpecializations: [...unmappedSpecs].sort(),
    unmappedAcceptedValues: [...unmappedAccepted].sort(),
    sampleProposals: proposals
      .filter((p) => Object.keys(p.updates).length > 0)
      .slice(0, 25)
      .map((p) => ({
        productId: p.productId,
        title: p.title,
        issues: p.issues,
        risks: p.risks,
        updates: p.updates,
        derived: p.derived,
      })),
  };

  console.log('Totals');
  console.log(`  Products audited:     ${summary.totals.products}`);
  console.log(`  Dishes (inspiration): ${summary.totals.dishes}`);
  console.log(`  Legacy listings:      ${summary.totals.legacyListings}`);
  console.log(`  Fully canonical:      ${summary.totals.fullyCanonical}`);
  console.log(`  Needs backfill:       ${summary.totals.needsBackfill}`);
  console.log(`  Audit-only flags:     ${summary.totals.auditOnlyIssues}`);

  console.log('\nIssue breakdown');
  for (const [k, v] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  if (unmappedSpecs.size > 0) {
    console.log(`\nUnmapped specializations (${unmappedSpecs.size} unique):`);
    for (const v of [...unmappedSpecs].slice(0, 20)) {
      console.log(`  - ${v}`);
    }
    if (unmappedSpecs.size > 20) {
      console.log(`  ... and ${unmappedSpecs.size - 20} more`);
    }
  }

  if (unmappedAccepted.size > 0) {
    console.log(`\nUnmapped accepted values (${unmappedAccepted.size} unique):`);
    for (const v of [...unmappedAccepted].slice(0, 20)) {
      console.log(`  - ${v}`);
    }
  }

  console.log('\nNext steps');
  console.log('  npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run');
  console.log('  CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write');

  const outPath = resolve(
    root,
    'docs/audits/phase10c-normalization-audit-latest.json',
  );
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outPath}`);

  if (jsonOut) {
    console.log(JSON.stringify(summary, null, 2));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
