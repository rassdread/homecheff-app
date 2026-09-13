/**
 * Owner Edit integrity — bare UUID /edit must not strip to public listing,
 * and edit page must not re-fetch in a render loop.
 *
 * Regressions:
 * 1) product layout SEO redirect sent `/product/{uuid}/edit` → `/product/{slug}`
 * 2) edit page useEffect depended on unstable `t` from useTranslation →
 *    fetch → setState → new `t` → fetch forever (loading flicker / form reset)
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
const editPage = readFileSync(
  join(root, 'app/product/[id]/edit/page.tsx'),
  'utf8',
);
const offerForm = readFileSync(
  join(root, 'components/products/marketplace/MarketplaceOfferForm.tsx'),
  'utf8',
);
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

console.log('5) Profile Aanbod card contract: body → public, Edit → edit');
assert.match(
  productMgmt,
  /data-owner-listing-card="true"[\s\S]*?onClick=\{\(\) => router\.push\(`\/product\/\$\{product\.id\}`\)\}/,
);
assert.match(productMgmt, /data-owner-action="edit"/);
assert.match(productMgmt, /handleEdit\(product\)/);
assert.doesNotMatch(
  productMgmt,
  /data-owner-listing-card="true"[\s\S]*?onClick=\{\(\) =>[\s\S]*?buildProductEditPath/,
);
assert.match(
  productMgmt,
  /data-owner-action="edit"[\s\S]*?e\.preventDefault\(\)[\s\S]*?stopCardNavigation\(e\)[\s\S]*?handleEdit\(product\)/,
);

console.log('6) Edit page must not loop on unstable translation `t`');
assert.match(editPage, /productId is the only fetch key/);
assert.doesNotMatch(
  editPage,
  /\}, \[productId, routeParam, router, t\]\);/,
);
assert.match(editPage, /\}, \[productId\]\);/);
assert.match(editPage, /canonicalizedRef/);
assert.match(editPage, /currentPath !== canonicalEdit/);

console.log('7) Marketplace edit hydrate once per listing id');
assert.match(offerForm, /hydratedProductIdRef/);
assert.match(offerForm, /hydrate once per product id/);
assert.doesNotMatch(
  offerForm,
  /\}, \[editMode, existingProduct, marketplaceCategory\]\);/,
);
assert.match(offerForm, /if \(editMode\) return;/);

console.log('\nHOMECHEFF_LISTING_OWNER_EDIT_INTEGRITY_VALIDATED');
