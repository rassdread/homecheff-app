#!/usr/bin/env npx tsx
/**
 * Phase 3D — Dish (status, createdAt) index proposal guards.
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

const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const migrationSql =
  'docs/audits/homecheff-performance-phase3d-migrations/20260712_dish_status_created_at_index.sql';
const planDoc = 'docs/audits/homecheff-performance-phase3d-index-migration-plan.md';

console.log('=== Phase 3D — Dish index ===\n');

ok('schema has status+createdAt index on Dish', schema.includes('@@index([status, createdAt(sort: Desc)])'));
ok('no duplicate Dish status index lines', (schema.match(/@@index\(\[status, createdAt/g) ?? []).length === 1);
ok('CONCURRENTLY SQL proposal exists', fs.existsSync(migrationSql));
ok(
  'migration SQL uses CONCURRENTLY',
  fs.readFileSync(migrationSql, 'utf8').includes('CREATE INDEX CONCURRENTLY'),
);
ok('migration plan doc exists', fs.existsSync(planDoc));
ok(
  'plan documents production rollout',
  fs.readFileSync(planDoc, 'utf8').includes('productie') ||
    fs.readFileSync(planDoc, 'utf8').includes('Production'),
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
