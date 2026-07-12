#!/usr/bin/env npx tsx
/**
 * Phase 3D — Apply Dish (status, createdAt) index on preview Neon via DIRECT_URL.
 *
 * Safety:
 * - Requires PHASE3D_PREVIEW_INDEX=1
 * - Uses DIRECT_URL (non-pooled) via `prisma db execute`
 * - Refuses when PHASE3D_BLOCK_INDEX=1
 *
 * Usage:
 *   PHASE3D_PREVIEW_INDEX=1 npx tsx --env-file=.env.local scripts/apply-preview-dish-index-phase3d.ts
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

function parseHost(url: string): string {
  try {
    return new URL(url.replace('postgresql://', 'http://')).hostname;
  } catch {
    return 'unknown';
  }
}

async function main() {
  if (process.env.PHASE3D_BLOCK_INDEX === '1') {
    console.error('Blocked: PHASE3D_BLOCK_INDEX=1');
    process.exit(1);
  }
  if (process.env.PHASE3D_PREVIEW_INDEX !== '1') {
    console.error('Refusing to run without PHASE3D_PREVIEW_INDEX=1');
    process.exit(1);
  }

  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error('DIRECT_URL is required');
    process.exit(1);
  }

  console.log('target_host', parseHost(directUrl));

  const prisma = new PrismaClient({
    datasources: { db: { url: directUrl } },
  });

  try {
    const before = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE tablename = 'Dish' ORDER BY indexname
    `;
    console.log('indexes_before', before.map((r) => r.indexname));

    if (before.some((r) => r.indexname === 'Dish_status_createdAt_idx')) {
      console.log('index_already_exists — skipping CREATE');
    } else {
      const sqlPath = resolve(
        'docs/audits/homecheff-performance-phase3d-migrations/20260712_dish_status_created_at_index.sql',
      );
      const oneLiner =
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS "Dish_status_createdAt_idx" ON "Dish" ("status", "createdAt" DESC);';
      const tmp = resolve('docs/audits/homecheff-performance-phase3d-migrations/_apply_preview_index.sql');
      writeFileSync(tmp, oneLiner + '\n', 'utf8');
      console.log('creating_index...');
      execSync(`npx prisma db execute --url "${directUrl}" --file "${tmp}"`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('index_created');
    }

    const after = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE tablename = 'Dish' ORDER BY indexname
    `;
    console.log('indexes_after', after.map((r) => r.indexname));

    const explain = await prisma.$queryRaw<{ 'QUERY PLAN': string }[]>`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT d.*
      FROM "Dish" d
      WHERE d.status = 'PUBLISHED'
      ORDER BY d."createdAt" DESC
      LIMIT 30
    `;
    console.log('EXPLAIN after index:');
    for (const row of explain) {
      console.log(row['QUERY PLAN']);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
