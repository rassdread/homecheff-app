import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  canonicalItemHandoffBody,
  isHttpsListingUrl,
  isItemHandoffTokenSizeOk,
  isPx4aItemReturnSearch,
  isTrustedStudioHandoffAction,
  normalizeItemPhotoUrls,
  normalizeItemReturnPath,
  parseItemHandoffPayload,
  px4aItemReturnResult,
  studioItemHandoffAction,
} from './px4a-item-handoff';
import {
  createItemHandoffPayload,
  signItemHandoffPayload,
  verifyItemHandoffToken,
} from './px4a-item-handoff-hmac';
import {
  PX4A_ITEM_FORM_DRAFT_TTL_MS,
  clearPx4aItemFormDraft,
  readPx4aItemFormDraft,
  shouldRestorePx4aItemFormDraft,
  writePx4aItemFormDraft,
} from './px4a-item-form-draft';

describe('PX.4A.4 HomeCheff item handoff', () => {
  it('accepts only https listing URLs and /sell/new return', () => {
    assert.equal(isHttpsListingUrl('https://blob.vercel-storage.com/a.jpg'), true);
    assert.equal(isHttpsListingUrl('http://insecure.example/a.jpg'), false);
    assert.deepEqual(
      normalizeItemPhotoUrls(['https://cdn.example/a.jpg', 'javascript:alert(1)', 'https://cdn.example/a.jpg']),
      ['https://cdn.example/a.jpg'],
    );
    assert.equal(normalizeItemReturnPath('/sell/new?px4a=1'), '/sell/new');
    assert.equal(normalizeItemReturnPath('/account'), null);
  });

  it('signs tokens without listing title, description, or query media', () => {
    const payload = createItemHandoffPayload({
      centralUserId: 'user-1',
      photoUrls: ['https://cdn.example/p1.jpg'],
      nowSec: 1_000_000,
    });
    assert.ok(payload);
    const body = canonicalItemHandoffBody(payload!);
    assert.equal(body.includes('title'), false);
    assert.equal(body.includes('description'), false);
    const token = signItemHandoffPayload(payload!, 'test-secret');
    assert.deepEqual(verifyItemHandoffToken(token, ['test-secret'], 1_000_000), payload);
    assert.equal(verifyItemHandoffToken(token, ['other'], 1_000_000), null);
    assert.equal(isItemHandoffTokenSizeOk(token), true);
  });

  it('rejects tampered return paths and malformed payloads', () => {
    assert.equal(
      parseItemHandoffPayload({
        v: 1,
        u: 'u1',
        p: ['https://cdn.example/a.jpg'],
        e: Date.now() / 1000 + 60,
        r: '/studio',
      }),
      null,
    );
  });

  it('keeps the Studio action on the handoff route only', () => {
    assert.match(studioItemHandoffAction(), /\/api\/photo-video\/item-handoff$/);
    assert.equal(isTrustedStudioHandoffAction(studioItemHandoffAction()), true);
    assert.equal(isTrustedStudioHandoffAction('https://evil.example/api/photo-video/item-handoff'), false);
    assert.equal(isPx4aItemReturnSearch('?px4a=1'), true);
    assert.equal(px4aItemReturnResult('?px4a=1&px4aResult=ready'), 'ready');
  });

  it('does not import the Studio compositor into the listing wizard', () => {
    const form = readFileSync('components/products/marketplace/MarketplaceOfferForm.tsx', 'utf8');
    const block = readFileSync('components/products/marketplace/ListingPhotoVideoBlock.tsx', 'utf8');
    assert.match(form, /ListingPhotoVideoBlock/);
    assert.match(form, /VideoUploader/);
    assert.doesNotMatch(form, /photo-video-composer/);
    assert.doesNotMatch(block, /photo-video-composer/);
    assert.match(block, /px4a-make-free-video/);
    assert.match(block, /videoReplace/);
    assert.doesNotMatch(block, /Open HomeCheff Studio/);
  });

  it('restores the listing snapshot on browser Back without a query string', () => {
    const form = readFileSync('components/products/marketplace/MarketplaceOfferForm.tsx', 'utf8');
    assert.match(form, /shouldRestorePx4aItemFormDraft/);
    assert.doesNotMatch(form, /isPx4aItemReturnSearch\(window\.location\.search\)/);
    const draft = readFileSync('lib/studio/px4a-item-form-draft.ts', 'utf8');
    assert.match(draft, /sessionStorage/);
    assert.match(draft, /shouldRestorePx4aItemFormDraft/);
  });

  it('treats sessionStorage as the HomeCheff draft source of truth', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    (globalThis as { sessionStorage?: typeof storage }).sessionStorage = storage;
    (globalThis as { window?: { sessionStorage: typeof storage } }).window = {
      sessionStorage: storage,
    };

    assert.equal(shouldRestorePx4aItemFormDraft(), false);
    const ok = writePx4aItemFormDraft({
      listingIntent: 'OFFER',
      marketplaceCategory: 'FOOD',
      specializations: ['soup'],
      acceptedSpecializations: [],
      barterOpenness: 'MONEY',
      title: 'Verse roti',
      description: 'Huisgemaakt',
      price: '12,50',
      priceModel: 'FIXED',
      acceptHomeCheffPayment: true,
      acceptDirectContact: false,
      fulfillment: { pickup: true },
      sellerCanDeliver: false,
      deliveryRadiusKm: '5',
      useProfileLocation: true,
      placeName: 'Utrecht',
      pickupAddress: '',
      pickupLat: 52.09,
      pickupLng: 5.12,
      coordsSource: 'place',
      stock: '1',
      maxStock: '',
      isActive: true,
      images: [{ url: 'https://cdn.example/a.jpg' }, { url: 'blob:local' }],
      video: null,
      allergens: [],
      allergensConfirmed: false,
      sellerContributionTypes: [],
      sellerContributionNote: '',
      madeToConsumerSpecifications: false,
      rapidlyPerishable: false,
    });
    assert.equal(ok, true);
    assert.equal(shouldRestorePx4aItemFormDraft(), true);
    const snap = readPx4aItemFormDraft();
    assert.equal(snap?.title, 'Verse roti');
    assert.deepEqual(snap?.images, [{ url: 'https://cdn.example/a.jpg' }]);
    assert.equal(shouldRestorePx4aItemFormDraft(Date.now() + PX4A_ITEM_FORM_DRAFT_TTL_MS + 1), false);
    clearPx4aItemFormDraft();
    assert.equal(shouldRestorePx4aItemFormDraft(), false);
  });
});
