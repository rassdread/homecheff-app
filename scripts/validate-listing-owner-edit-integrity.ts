/**
 * Owner Edit integrity — bare UUID /edit must not strip to public listing.
 *
 * Regression: product layout SEO redirect sent `/product/{uuid}/edit` →
 * `/product/{slug}` (public detail). Redirects now live on public page only.
 *
 * Run: npx tsx scripts/validate-listing-owner-edit-integrity.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildProductDetailPath,
  buildProductEditPath,
  isBareProductUuidParam,
  isProductEditPathname,
} from '../lib/seo/productSlug';

const root = process.cwd();
const layout = readFileSync(join(root, 'app/product/[id]/layout.tsx'), 'utf8');
const page = readFileSync(join(root, 'app/product/[id]/page.tsx'), 'utf8');
const boundary = readFileSync(join(root, 'lib/ui/card-action-boundary.ts'), 'utf8');
const productMgmt = readFileSync(
  join(root, 'components/profile/ProductManagement.tsx'),
  'utf8',
);

console.log('1) Helpers');
const id = 'fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';
assert.equal(isBareProductUuidParam(id), true);
assert.equal(
  buildProductEditPath('HomeCheff Design Studio', 'Vlaardingen', id),
  `/product/homecheff-design-studio-vlaardingen-hcid-${id}/edit`,
);
assert.equal(
  buildProductDetailPath('HomeCheff Design Studio', 'Vlaardingen', id),
  `/product/homecheff-design-studio-vlaardingen-hcid-${id}`,
);
assert.equal(isProductEditPathname(`/product/${id}/edit`), true);
assert.equal(
  isProductEditPathname(
    `/product/homecheff-design-studio-vlaardingen-hcid-${id}/edit`,
  ),
  true,
);
assert.equal(
  isProductEditPathname(
    `/product/homecheff-design-studio-vlaardingen-hcid-${id}`,
  ),
  false,
);

console.log('2) Layout must NOT bare-UUID redirect (shared with /edit)');
assert.equal(layout.includes('isBareProductUuidParam'), false);
assert.equal(layout.includes('buildProductDetailPath'), false);
assert.match(layout, /Do not redirect bare-UUID/);

console.log('3) Public page owns SEO redirects');
assert.match(page, /isBareProductUuidParam/);
assert.match(page, /buildProductDetailPath/);
assert.match(page, /Public SEO redirects/);

console.log('4) Shared card action boundary');
assert.match(boundary, /cardActionBoundaryProps/);
assert.match(productMgmt, /cardActionBoundaryProps/);
assert.match(productMgmt, /buildProductEditPath/);

console.log('\nHOMECHEFF_LISTING_OWNER_EDIT_INTEGRITY_VALIDATED');
