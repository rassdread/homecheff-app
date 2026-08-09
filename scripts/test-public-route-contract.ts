/**
 * Regression: public listing + profile href contract.
 * Run: npx tsx scripts/test-public-route-contract.ts
 */
import assert from 'node:assert/strict';
import { getFeedItemHref, getListingHref } from '../lib/routing/public-hrefs';
import {
  getPublicProfileHref,
  isPublicUsername,
  profileFallbackHref,
  publicProfileHref,
} from '../lib/user/public-profile';
import { resolveProductIdFromParam } from '../lib/seo/productSlug';
import {
  listingDetailApiPath,
  normalizeListingDetailRouteParam,
} from '../lib/marketplace/detail/listing-detail-route';

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

check('listing href uses product slug with hcid', () => {
  const href = getListingHref({
    id: '4f822286-6043-417d-8be5-1bae8342d3a9',
    title: 'Kunstschilderijen',
    place: 'Grotestraat',
    listingIntent: 'OFFER',
  });
  assert.match(href, /^\/product\/kunstschilderijen-grotestraat-hcid-4f822286-6043-417d-8be5-1bae8342d3a9$/);
});

check('request listing uses /request prefix', () => {
  const href = getListingHref({
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    title: 'Zoek taart',
    place: 'Rotterdam',
    listingIntent: 'REQUEST',
  });
  assert.match(href, /^\/request\//);
  assert.match(href, /hcid-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee$/);
});

check('feed dish inspiration uses vertical route', () => {
  const href = getFeedItemHref({
    id: '8c609bde-4e0a-4e65-9f4f-4405c42c4d44',
    title: 'Songteksten',
    type: 'dish',
    category: 'DESIGNER',
  } as any);
  assert.equal(href, '/design/8c609bde-4e0a-4e65-9f4f-4405c42c4d44');
});

check('public username profile href is encoded', () => {
  assert.equal(getPublicProfileHref('u1', 'Kunstgalerij'), '/user/Kunstgalerij');
  assert.equal(isPublicUsername('temp_123'), false);
});

check('temp username falls back to uuid', () => {
  const id = '83221c39-f756-43bd-99cd-da9a48de8409';
  assert.equal(publicProfileHref(id, 'temp_1777716708506_1tlo6e7r8'), `/user/${id}`);
  assert.equal(getPublicProfileHref(id, 'Admin User'), `/user/${id}`);
});

check('profileFallbackHref never uses dead /profile/[id]', () => {
  const id = '83221c39-f756-43bd-99cd-da9a48de8409';
  assert.equal(profileFallbackHref(id), `/user/${id}`);
  assert.doesNotMatch(profileFallbackHref(id), /\/profile\//);
});

check('API path strips slug trailing slash and uses UUID', () => {
  const param =
    'k-s-berkel-rodenrijs-hcid-3b85deeb-5801-417a-a087-5b6027130ae0/';
  assert.equal(
    resolveProductIdFromParam(normalizeListingDetailRouteParam(param)),
    '3b85deeb-5801-417a-a087-5b6027130ae0',
  );
  assert.equal(
    listingDetailApiPath(param),
    '/api/products/3b85deeb-5801-417a-a087-5b6027130ae0',
  );
});

check('invalid profile inputs return null', () => {
  assert.equal(getPublicProfileHref('', 'x'), null);
  assert.equal(getPublicProfileHref('not-a-uuid', 'temp_x'), null);
});

check('ProductSaleCommerceZone imports hasPublicDisplayPrice', () => {
  const fs = require('node:fs') as typeof import('node:fs');
  const src = fs.readFileSync(
    'components/product/detail/ProductSaleCommerceZone.tsx',
    'utf8',
  );
  assert.match(src, /hasPublicDisplayPrice/);
  assert.match(
    src,
    /import\s*\{[^}]*hasPublicDisplayPrice[^}]*\}\s*from\s*['"]@\/lib\/product\/order-method['"]/,
  );
});

check('ClickableName uses getPublicProfileHref SSOT', () => {
  const fs = require('node:fs') as typeof import('node:fs');
  const src = fs.readFileSync('components/ui/ClickableName.tsx', 'utf8');
  assert.match(src, /getPublicProfileHref/);
  assert.doesNotMatch(src, /\$\{user\.sellerProfileId \|\| user\.id\}/);
});

check('legacy listing + profile redirect pages exist', () => {
  const fs = require('node:fs') as typeof import('node:fs');
  assert.ok(fs.existsSync('app/listing/[id]/page.tsx'));
  assert.ok(fs.existsSync('app/profile/[userId]/page.tsx'));
  const listing = fs.readFileSync('app/listing/[id]/page.tsx', 'utf8');
  assert.match(listing, /buildListingDetailHref/);
  const profile = fs.readFileSync('app/profile/[userId]/page.tsx', 'utf8');
  assert.match(profile, /redirect\(`\/user\//);
});

console.log(`\n${passed} checks passed`);
