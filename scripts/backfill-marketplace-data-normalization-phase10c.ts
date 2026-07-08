#!/usr/bin/env npx tsx
/**
 * Phase 10C — Safe marketplace data backfill.
 *
 * Dry-run (default):
 *   npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --dry-run
 *
 * Write (requires confirmation):
 *   CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write
 *
 * Options:
 *   --limit=N   Process at most N products
 *   --id=UUID   Process a single product
 *
 * Idempotent: re-running after a successful write produces zero updates.
 * No deletes. Explicit DB values are preserved except documented legacy fixes.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  hasWritableUpdates,
  proposeProductNormalization,
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
const dryRun =
  process.argv.includes('--dry-run') ||
  (!process.argv.includes('--write') && !process.argv.includes('--apply'));
const writeMode = process.argv.includes('--write') || process.argv.includes('--apply');
const confirmed = process.env.CONFIRM_BACKFILL === '1';
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const idArg = process.argv.find((a) => a.startsWith('--id='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
const singleId = idArg ? idArg.split('=')[1] : null;

async function main() {
  console.log('=== Phase 10C — Marketplace data backfill ===\n');
  console.log(`Mode: ${dryRun ? 'DRY-RUN (no writes)' : 'WRITE'}`);

  if (writeMode && !dryRun && !confirmed) {
    console.error(
      '\nRefusing to write without CONFIRM_BACKFILL=1. Run dry-run first.',
    );
    process.exit(1);
  }

  const products = await prisma.product.findMany({
    where: singleId ? { id: singleId } : undefined,
    take: singleId ? 1 : limit ?? undefined,
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

  let examined = 0;
  let wouldUpdate = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of products) {
    examined += 1;
    const stripeReady = !!(
      row.seller?.User?.stripeConnectAccountId &&
      row.seller?.User?.stripeConnectOnboardingCompleted
    );
    const proposal = proposeProductNormalization({
      ...row,
      barterOpenness: row.barterOpenness,
      sellerStripeConnectReady: stripeReady,
    });

    if (!hasWritableUpdates(proposal)) {
      skipped += 1;
      continue;
    }

    wouldUpdate += 1;
    const data = proposal.updates;

    if (dryRun) {
      console.log(
        `[dry-run] ${row.id} "${row.title}" → ${JSON.stringify(data)}`,
      );
      continue;
    }

    try {
      await prisma.product.update({
        where: { id: row.id },
        data,
      });
      updated += 1;
      console.log(`[updated] ${row.id} "${row.title}"`);
    } catch (err) {
      errors += 1;
      console.error(`[error] ${row.id}:`, err);
    }
  }

  console.log('\nSummary');
  console.log(`  Examined:    ${examined}`);
  console.log(`  Would update:${wouldUpdate}`);
  console.log(`  Updated:     ${updated}`);
  console.log(`  Skipped:     ${skipped}`);
  console.log(`  Errors:      ${errors}`);

  if (dryRun && wouldUpdate > 0) {
    console.log(
      '\nTo apply: CONFIRM_BACKFILL=1 npx tsx scripts/backfill-marketplace-data-normalization-phase10c.ts --write',
    );
  }

  console.log('\nRollback notes');
  console.log(
    '  Revert per product via DB restore or inverse patch from dry-run log.',
  );
  console.log(
    '  No fields are deleted; accepted values are normalized in-place only.',
  );

  if (errors > 0) process.exit(1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
