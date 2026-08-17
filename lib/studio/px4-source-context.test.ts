import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  PX4_EXCLUDED_LISTING_FIELDS,
  PX4_MEDIA_CAP,
  authorizeOwnerProductProjection,
  buildStudioListingCreateHref,
  isPx4OpaqueId,
  normalizeListingMediaUrls,
  sellerDisplayNameFromUser,
  shouldShowStudioCreateCta,
  signStudioSourceContextRequest,
  studioPx4CanonicalPath,
  toStudioListingProjection,
  verifyStudioSourceContextRequest,
} from './px4-source-context';

const OWNER = '11111111-1111-4111-8111-111111111111';
const PRODUCT = '22222222-2222-4222-8222-222222222222';
const FOREIGN = '33333333-3333-4333-8333-333333333333';

describe('PX.4 HomeCheff → Studio context', () => {
  it('shows the CTA only for the listing owner', () => {
    assert.equal(shouldShowStudioCreateCta(true), true);
    assert.equal(shouldShowStudioCreateCta(false), false);
  });

  it('builds a path-based Studio deep link without listing PII', () => {
    const href = buildStudioListingCreateHref(PRODUCT);
    assert.equal(href, `https://studio.homecheff.eu${studioPx4CanonicalPath(PRODUCT)}`);
    assert.doesNotMatch(href, /title=|description=|price=/);
    assert.equal(isPx4OpaqueId('nope'), false);
    assert.equal(buildStudioListingCreateHref('nope'), 'https://studio.homecheff.eu');
  });

  it('does not leak foreign or removed listings', () => {
    assert.equal(
      authorizeOwnerProductProjection({ sellerUserId: OWNER, integrityStatus: 'ACTIVE' }, OWNER).ok,
      true,
    );
    assert.equal(
      authorizeOwnerProductProjection({ sellerUserId: OWNER, integrityStatus: 'ACTIVE' }, FOREIGN).ok,
      false,
    );
    assert.equal(authorizeOwnerProductProjection(null, OWNER).ok, false);
    assert.equal(
      authorizeOwnerProductProjection({ sellerUserId: OWNER, integrityStatus: 'REMOVED' }, OWNER).ok,
      false,
    );
  });

  it('projects only safe listing fields and caps images', () => {
    const projection = toStudioListingProjection({
      id: PRODUCT,
      title: 'Verse Surinaamse roti',
      description: 'Huisgemaakt',
      category: 'FOOD',
      marketplaceCategory: 'FOOD',
      imageUrls: Array.from({ length: 12 }, (_, i) => `https://blob.vercel-storage.com/${i}.jpg`),
      sellerDisplayName: 'Sergio',
    });
    assert.equal(projection.media.length, PX4_MEDIA_CAP);
    assert.equal(projection.title, 'Verse Surinaamse roti');
    assert.ok(!('priceCents' in projection));
    for (const field of PX4_EXCLUDED_LISTING_FIELDS) {
      assert.equal(Object.prototype.hasOwnProperty.call(projection, field), false);
    }
    const extra = normalizeListingMediaUrls(['http://x', 'javascript:alert(1)']);
    assert.equal(extra.length, 0);
  });

  it('HMAC rejects a swapped central user id', () => {
    const secret = 'px4-hc-test-secret-16';
    const timestampSec = 1_700_000_000;
    const signature = signStudioSourceContextRequest({
      secret,
      timestampSec,
      centralUserId: OWNER,
      sourceType: 'product',
      sourceId: PRODUCT,
    });
    assert.equal(
      verifyStudioSourceContextRequest({
        secrets: [secret],
        timestampSec,
        nowSec: timestampSec,
        signature,
        centralUserId: FOREIGN,
        sourceType: 'product',
        sourceId: PRODUCT,
      }),
      false,
    );
  });

  it('never uses email as seller display name', () => {
    assert.equal(
      sellerDisplayNameFromUser({ name: 'Ada', username: 'ada', displayFullName: true }),
      'Ada',
    );
    assert.equal(
      sellerDisplayNameFromUser({
        name: 'secret@example.com' as string,
        username: 'cook',
        displayFullName: false,
      }),
      'cook',
    );
  });

  it('wires owner CTA and internal API without mutating listings', () => {
    const actions = readFileSync('components/product/detail/ProductSalePrimaryActions.tsx', 'utf8');
    assert.match(actions, /px4-studio-create-cta/);
    assert.match(actions, /shouldShowStudioCreateCta/);
    assert.match(actions, /buildStudioListingCreateHref/);
    assert.match(actions, /buildStudioListingCreateHref\(product\.id\)/);
    const api = readFileSync('app/api/internal/studio/source-context/route.ts', 'utf8');
    assert.match(api, /verifyStudioSourceContextRequest/);
    assert.match(api, /authorizeOwnerProductProjection/);
    assert.doesNotMatch(api, /prisma\.product\.update/);
    assert.doesNotMatch(api, /priceCents/);
  });
});
