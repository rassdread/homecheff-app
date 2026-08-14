/**
 * LEGAL-2 food allergen integrity checks.
 *
 *   npx tsx scripts/validate-legal-2-food-allergens.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  EU_FOOD_ALLERGEN_IDS,
  EU_FOOD_ALLERGEN_LABELS,
  sanitizeEuFoodAllergenIds,
} from '../lib/legal/eu-food-allergens';
import {
  productRequiresAllergenConfirmation,
  resolveFoodAllergenApplicability,
} from '../lib/legal/food-allergen-applicability';
import {
  buildAllergenConfirmationUpdate,
  buildFoodAllergenContext,
} from '../lib/legal/food-allergen-context';

const ROOT = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

assert.equal(EU_FOOD_ALLERGEN_IDS.length, 14);
for (const id of EU_FOOD_ALLERGEN_IDS) {
  assert.ok(EU_FOOD_ALLERGEN_LABELS[id].nl.length > 0);
  assert.ok(EU_FOOD_ALLERGEN_LABELS[id].en.length > 0);
}

// Untouched empty != confirmed none
{
  const unknown = buildFoodAllergenContext({
    category: 'CHEFF',
    marketplaceCategory: 'CREATE',
    specializations: ['create.meal'],
    allergens: [],
    allergensConfirmedAt: null,
  });
  assert.equal(unknown.status, 'UNKNOWN');
  assert.equal(unknown.blocksTransaction, true);
  assert.deepEqual(unknown.allergens, []);
}

// Confirmed empty = none of 14
{
  const none = buildFoodAllergenContext({
    category: 'CHEFF',
    marketplaceCategory: 'CREATE',
    specializations: ['create.meal'],
    allergens: [],
    allergensConfirmedAt: new Date('2026-08-14T12:00:00.000Z'),
  });
  assert.equal(none.status, 'CONFIRMED');
  assert.equal(none.blocksTransaction, false);
  assert.deepEqual(none.allergens, []);
}

// Selected allergens persist via sanitize
{
  const ids = sanitizeEuFoodAllergenIds(['MILK', 'GLUTEN', 'bogus', 'MILK']);
  assert.deepEqual(ids, ['MILK', 'GLUTEN']);
  const upd = buildAllergenConfirmationUpdate({
    allergens: ids,
    confirmed: true,
    now: new Date('2026-08-14T12:00:00.000Z'),
  });
  assert.ok(upd);
  assert.deepEqual(upd!.allergens, ['MILK', 'GLUTEN']);
  assert.equal(upd!.allergensConfirmedAt?.toISOString(), '2026-08-14T12:00:00.000Z');
}

// GROW not required
assert.equal(
  productRequiresAllergenConfirmation({
    marketplaceCategory: 'GROW',
    specializations: ['grow.tomato'],
  }),
  false,
);
assert.equal(resolveFoodAllergenApplicability({ marketplaceCategory: 'GROW' }), 'NOT_APPLICABLE');

// Prepared food required
assert.equal(
  productRequiresAllergenConfirmation({
    marketplaceCategory: 'CREATE',
    specializations: ['create.cake'],
  }),
  true,
);

// Craft create not food
assert.equal(
  productRequiresAllergenConfirmation({
    marketplaceCategory: 'CREATE',
    specializations: ['create.jewelry'],
  }),
  false,
);

// Service not food
assert.equal(
  productRequiresAllergenConfirmation({
    marketplaceCategory: 'PRACTICAL_SERVICE',
  }),
  false,
);

// Non-food designer
assert.equal(
  productRequiresAllergenConfirmation({ category: 'DESIGNER' }),
  false,
);

// Commerce declaration not mutated by food libs
{
  const ctx = read('lib/legal/food-allergen-context.ts');
  assert.equal(ctx.includes('commerceDeclaration'), false);
  assert.equal(ctx.includes('SELF_DECLARED_PROFESSIONAL'), false);
}

// No AI allergen inference from ingredient text
{
  const src = read('lib/legal/food-allergen-context.ts');
  assert.equal(src.includes('openai'), false);
  assert.equal(src.includes('fromIngredient'), false);
}

// Feed freeze
{
  const feed = read('app/api/feed/route.ts');
  assert.equal(feed.includes('allergensConfirmedAt'), false);
  assert.equal(feed.includes('eu-food-allergens'), false);
}

// Checkout + proposal gates present
{
  assert.match(read('app/api/checkout/route.ts'), /assertProductsAllergenConfirmationOr400/);
  assert.match(
    read('app/api/proposals/[proposalId]/accept/route.ts'),
    /assertProductAllergenConfirmationOrThrow/,
  );
}

// Schema + migration: no false backfill
{
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /allergensConfirmedAt\s+DateTime\?/);
  const mig = read(
    'prisma/migrations/20260814140000_legal2_product_food_allergens/migration.sql',
  );
  assert.match(mig, /ADD COLUMN IF NOT EXISTS "allergens"/);
  assert.equal(mig.toLowerCase().includes('update "product" set'), false);
}

// UX copy not "allergeenvrij"
{
  const listing = read('components/legal/FoodAllergenListingInfo.tsx');
  assert.equal(listing.toLowerCase().includes('allergeenvrij'), false);
  assert.match(listing, /geen van de 14/);
  assert.match(listing, /nog niet bevestigd/);
}

console.log('LEGAL-2 food allergens validation: OK');
