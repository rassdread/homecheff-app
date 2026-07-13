#!/usr/bin/env npx tsx
/**
 * Phase 3D — Dish feed query shape + EXPLAIN readiness guards.
 */
import * as fs from 'node:fs';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

const feedRoute = fs.readFileSync('app/api/feed/route.ts', 'utf8');
const dishQuery = fs.existsSync('lib/feed/feed-dish-query.server.ts')
  ? fs.readFileSync('lib/feed/feed-dish-query.server.ts', 'utf8')
  : '';
const dishSources = feedRoute + dishQuery;

console.log('=== Phase 3D — Dish query plan ===\n');

ok('dish findMany uses status PUBLISHED', dishSources.includes('status: "PUBLISHED"') || dishSources.includes("status: 'PUBLISHED'"));
ok('dish orderBy createdAt desc', dishSources.includes('createdAt: "desc"') || dishSources.includes("createdAt: 'desc'"));
ok('dish take uses FEED_DB_DISH_CAP', dishSources.includes('FEED_DB_DISH_CAP'));
ok('dish optional notIn linkedProductIds', feedRoute.includes('notIn: linkedProductIds'));
ok('dish photos select idx only', dishSources.includes('select: { idx: true }'));
ok('dish metadata loader present', feedRoute.includes('loadDishPhotoMetadata'));
const auditPath = 'docs/audits/homecheff-performance-phase3d-dish-query-plan.md';
ok('audit doc exists', fs.existsSync(auditPath));
ok(
  'audit documents seq scan before index',
  fs.readFileSync(auditPath, 'utf8').includes('Seq Scan') ||
    fs.readFileSync(auditPath, 'utf8').includes('seq scan'),
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
