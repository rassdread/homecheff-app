#!/usr/bin/env npx tsx
/**
 * Phase 3C — raw SQL media metadata safety guards.
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

const meta = fs.readFileSync('lib/feed/feed-media-metadata.server.ts', 'utf8');
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

console.log('=== Phase 3C — Raw SQL safety ===\n');

ok('uses $queryRaw only', meta.includes('prisma.$queryRaw'));
ok('no $queryRawUnsafe', !meta.includes('$queryRawUnsafe'));
ok('parameterized uuid array', meta.includes('::uuid[]'));
ok('empty list early return product', meta.includes('capped.length === 0'));
ok('empty list early return dish', (meta.match(/capped\.length === 0/g) ?? []).length >= 2);
ok('product id cap', meta.includes('FEED_DB_PRODUCT_CAP'));
ok('dish id cap', meta.includes('FEED_DB_DISH_CAP'));
ok('no full fileUrl select', !meta.includes('SELECT "fileUrl"') && !meta.includes('SELECT fileUrl'));
ok('legacy sentinel via parameter', meta.includes('${LEGACY_SENTINEL}'));
ok('Image table quoted', meta.includes('FROM "Image"'));
ok('DishPhoto table quoted', meta.includes('FROM "DishPhoto"'));
ok('schema has Image model', schema.includes('model Image'));
ok('schema has DishPhoto model', schema.includes('model DishPhoto'));
ok('productId column in Image', schema.includes('productId String'));
ok('dishId column in DishPhoto', schema.includes('dishId String'));
ok('no string concat SQL', !meta.includes("`SELECT") && !meta.includes('+ id'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
