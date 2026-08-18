import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  PX4A_ITEM_FORM_DRAFT_KEY,
  PX4A_ITEM_FORM_DRAFT_TTL_MS,
  clearPx4aItemFormDraft,
  entryResultFromPx4aItemFormDraft,
  httpsListingImageUrls,
  isPx4aItemFormDraftPopulated,
  readPx4aItemFormDraft,
  serializableListingVideo,
  shouldRestorePx4aItemFormDraft,
  writePx4aItemFormDraft,
  type Px4aItemFormDraftInput,
} from './px4a-item-form-draft';
import { px4aItemReturnResult } from './px4a-item-handoff';

function mockSessionStorage() {
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
  return store;
}

function populatedDraft(overrides: Partial<Px4aItemFormDraftInput> = {}): Px4aItemFormDraftInput {
  return {
    listingIntent: 'OFFER',
    marketplaceCategory: 'CREATE',
    specializations: ['soup'],
    acceptedSpecializations: ['soup'],
    barterOpenness: 'MONEY',
    title: 'PX4A Draft Restore Test',
    description: 'HomeCheff Studio round trip',
    price: '12,50',
    priceModel: 'FIXED',
    acceptHomeCheffPayment: true,
    acceptDirectContact: false,
    fulfillment: { pickup: true, delivery: false },
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
    images: [
      { url: 'https://cdn.example/p1.jpg' },
      { url: 'https://cdn.example/p2.jpg' },
      { url: 'https://cdn.example/p3.jpg' },
      { url: 'https://cdn.example/p4.jpg' },
    ],
    video: {
      url: 'https://cdn.example/listing.mp4',
      thumbnail: 'https://cdn.example/listing.jpg',
      duration: 18,
    },
    allergens: ['GLUTEN'],
    allergensConfirmed: true,
    sellerContributionTypes: [],
    sellerContributionNote: '',
    madeToConsumerSpecifications: true,
    rapidlyPerishable: true,
    ...overrides,
  };
}

describe('PX.4A.4D HomeCheff listing draft round-trip', () => {
  it('A. writes a populated snapshot before Studio navigation', () => {
    mockSessionStorage();
    assert.equal(writePx4aItemFormDraft(populatedDraft()), true);
    const snap = readPx4aItemFormDraft();
    assert.equal(snap?.title, 'PX4A Draft Restore Test');
    assert.equal(shouldRestorePx4aItemFormDraft(), true);
  });

  it('B/C. restores the same snapshot for cancel and ready returns', () => {
    mockSessionStorage();
    writePx4aItemFormDraft(populatedDraft());
    assert.equal(px4aItemReturnResult('?px4a=1&px4aResult=cancel'), 'cancel');
    assert.equal(px4aItemReturnResult('?px4a=1&px4aResult=ready'), 'ready');
    assert.equal(shouldRestorePx4aItemFormDraft(), true);
    const form = readFileSync('components/products/marketplace/MarketplaceOfferForm.tsx', 'utf8');
    assert.match(form, /shouldRestorePx4aItemFormDraft\(\)/);
    assert.match(form, /readPx4aExportVideo\(\)/);
    assert.match(form, /attachPx4aExportVideo/);
    assert.match(form, /setTitle\(snap\.title\)/);
    assert.match(form, /setDescription\(snap\.description\)/);
    assert.match(form, /setMarketplaceCategory/);
    assert.match(form, /setPrice\(snap\.price\)/);
    assert.match(form, /setFulfillment/);
    assert.match(form, /setAllergensConfirmed/);
    assert.match(form, /setMadeToConsumerSpecifications/);
    assert.match(form, /setRapidlyPerishable/);
    assert.match(form, /setImages\(snap\.images/);
    assert.match(form, /setVideo\(snap\.video\)/);
  });

  it('D. empty initial write cannot overwrite a populated stored draft', () => {
    mockSessionStorage();
    assert.equal(writePx4aItemFormDraft(populatedDraft()), true);
    assert.equal(
      writePx4aItemFormDraft(
        populatedDraft({
          title: '',
          description: '',
          images: [],
          video: null,
        }),
      ),
      false,
    );
    assert.equal(readPx4aItemFormDraft()?.title, 'PX4A Draft Restore Test');
  });

  it('E. chooser remount does not clear the draft key', () => {
    const selector = readFileSync('components/products/CategoryFormSelector.tsx', 'utf8');
    assert.match(selector, /entryResultFromPx4aItemFormDraft/);
    assert.match(selector, /draftResumeChecked/);
    assert.doesNotMatch(selector, /clearPx4aItemFormDraft/);
    const isolation = readFileSync('hooks/useSessionIsolation.ts', 'utf8');
    assert.match(isolation, /prev\.current === 'authenticated' && status === 'unauthenticated'/);
    assert.doesNotMatch(isolation, /clearAllUserData\(\)/);
  });

  it('F–K. title, description, category, price, fulfillment, and legal flags survive', () => {
    mockSessionStorage();
    writePx4aItemFormDraft(populatedDraft());
    const snap = readPx4aItemFormDraft();
    assert.equal(snap?.title, 'PX4A Draft Restore Test');
    assert.equal(snap?.description, 'HomeCheff Studio round trip');
    assert.equal(snap?.marketplaceCategory, 'CREATE');
    assert.equal(snap?.price, '12,50');
    assert.deepEqual(snap?.fulfillment, { pickup: true, delivery: false });
    assert.equal(snap?.allergensConfirmed, true);
    assert.equal(snap?.madeToConsumerSpecifications, true);
    assert.equal(snap?.rapidlyPerishable, true);
    assert.deepEqual(snap?.allergens, ['GLUTEN']);
  });

  it('L. four listing photos survive in the same order', () => {
    mockSessionStorage();
    writePx4aItemFormDraft(populatedDraft());
    assert.deepEqual(readPx4aItemFormDraft()?.images, [
      { url: 'https://cdn.example/p1.jpg' },
      { url: 'https://cdn.example/p2.jpg' },
      { url: 'https://cdn.example/p3.jpg' },
      { url: 'https://cdn.example/p4.jpg' },
    ]);
  });

  it('M. Studio video-only / non-https photos cannot enter the listing gallery', () => {
    mockSessionStorage();
    writePx4aItemFormDraft(
      populatedDraft({
        images: [
          { url: 'https://cdn.example/listing.jpg' },
          { url: 'blob:https://studio.homecheff.eu/local-upload' },
          { url: 'http://insecure.example/x.jpg' },
        ],
      }),
    );
    assert.deepEqual(readPx4aItemFormDraft()?.images, [{ url: 'https://cdn.example/listing.jpg' }]);
    assert.deepEqual(
      httpsListingImageUrls([{ url: 'https://cdn.example/a.jpg' }, { url: 'blob:local' }, { url: 'http://insecure.example/x.jpg' }]),
      [{ url: 'https://cdn.example/a.jpg' }],
    );
  });

  it('N. existing listing video is restored only as an https reference, never as a File', () => {
    mockSessionStorage();
    writePx4aItemFormDraft(populatedDraft());
    assert.deepEqual(readPx4aItemFormDraft()?.video, {
      url: 'https://cdn.example/listing.mp4',
      thumbnail: 'https://cdn.example/listing.jpg',
      duration: 18,
    });
    assert.equal(serializableListingVideo({ url: 'blob:https://homecheff.eu/file' }), null);
    mockSessionStorage();
    assert.equal(
      writePx4aItemFormDraft(populatedDraft({ video: { url: 'blob:local' } })),
      true,
    );
    assert.equal(readPx4aItemFormDraft()?.video, null);
  });

  it('O/P. publish and explicit clear remove the draft; isolation flicker must not', () => {
    mockSessionStorage();
    writePx4aItemFormDraft(populatedDraft());
    clearPx4aItemFormDraft();
    assert.equal(readPx4aItemFormDraft(), null);

    const form = readFileSync('components/products/marketplace/MarketplaceOfferForm.tsx', 'utf8');
    assert.match(form, /if \(!editMode && data\.product\?\.id\) \{/);
    assert.match(form, /clearPx4aItemFormDraft\(\);/);
    const formDraft = readFileSync('lib/studio/px4a-item-form-draft.ts', 'utf8');
    assert.match(formDraft, /successful listing publish/);
    assert.match(formDraft, /confirmed logout/);
    assert.match(formDraft, /Must NOT be cleared on Studio departure/);

    const cleanup = readFileSync('lib/session-cleanup.ts', 'utf8');
    const isolationKeep = cleanup.slice(
      cleanup.indexOf('Preserve create-flow and PX.4A listing drafts'),
      cleanup.indexOf('// Clear any cached data'),
    );
    assert.match(isolationKeep, /PX4A_ITEM_FORM_DRAFT_KEY/);
    const logoutFn = cleanup.slice(cleanup.indexOf('export function clearSensitiveUserDataOnLogout'));
    const logoutKeep = logoutFn.slice(
      logoutFn.indexOf('clearSessionStorageExcept'),
      logoutFn.indexOf("if ('caches' in window)"),
    );
    assert.match(logoutKeep, /PX4A_ITEM_FORM_DRAFT_KEY/);
    const isolationHook = readFileSync('hooks/useSessionIsolation.ts', 'utf8');
    const guard = readFileSync('components/SessionGuard.tsx', 'utf8');
    assert.match(isolationHook, /clearPx4aItemFormDraft\(\)/);
    assert.match(guard, /clearPx4aItemFormDraft\(\)/);
    const identity = readFileSync('lib/session-cleanup.ts', 'utf8');
    assert.match(identity, /isDistinctSellerStorageIdentity/);
    assert.match(identity, /lastIsEmail !== currentIsEmail/);
  });

  it('Q. expired and corrupt drafts are cleared safely', () => {
    const store = mockSessionStorage();
    writePx4aItemFormDraft(populatedDraft());
    assert.equal(readPx4aItemFormDraft(Date.now() + PX4A_ITEM_FORM_DRAFT_TTL_MS + 1), null);
    assert.equal(store.get(PX4A_ITEM_FORM_DRAFT_KEY), undefined);

    store.set(PX4A_ITEM_FORM_DRAFT_KEY, '{not-json');
    assert.equal(readPx4aItemFormDraft(), null);
    assert.equal(store.get(PX4A_ITEM_FORM_DRAFT_KEY), undefined);
  });

  it('R. persistence failure blocks navigation and keeps in-memory form state', () => {
    const block = readFileSync('components/products/marketplace/ListingPhotoVideoBlock.tsx', 'utf8');
    const persistIdx = block.indexOf('const persisted = onPersistDraft();');
    const navIdx = block.indexOf('await startHomeCheffPhotoVideoCreator');
    assert.ok(persistIdx >= 0 && navIdx > persistIdx);
    assert.match(block, /if \(!persisted\) \{/);
    assert.match(block, /videoDraftPersistError/);
    assert.match(block, /setStarting\(false\);\s*return;/);
    const form = readFileSync('components/products/marketplace/MarketplaceOfferForm.tsx', 'utf8');
    assert.match(form, /const persistItemDraft = \(\): boolean => \{/);
    assert.match(form, /images\.some\(\(image\) => image\.uploading\)/);
    assert.match(form, /return writePx4aItemFormDraft\(/);
    const nl = readFileSync('public/i18n/nl.json', 'utf8');
    assert.match(nl, /Je item kon niet tijdelijk worden bewaard/);
  });

  it('does not treat File objects as serializable listing media', () => {
    mockSessionStorage();
    assert.equal(isPx4aItemFormDraftPopulated(populatedDraft({ title: '', description: '', images: [], video: null })), false);
    const resume = entryResultFromPx4aItemFormDraft({
      listingIntent: 'OFFER',
      marketplaceCategory: 'CREATE',
      specializations: ['soup'],
    });
    assert.deepEqual(resume, {
      listingIntent: 'OFFER',
      marketplaceCategory: 'CREATE',
      specializations: ['soup'],
    });
  });
});
