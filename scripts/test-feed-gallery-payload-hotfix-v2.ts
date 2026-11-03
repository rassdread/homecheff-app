#!/usr/bin/env npx tsx
/**
 * HOMECHEFF_FEED_GALLERY_PAYLOAD_HOTFIX_V2 regression.
 *
 * Proves API galleryUrls survive normalizeFeedItem → feed media sources.
 * Must fail if GeoFeed drops galleryUrls (old bug) or helper is unwired.
 * No React / Next imports — safe without a local install.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  normalizeFeedGalleryUrls,
  normalizeFeedItemGalleryField,
  resolveFeedMediaGallerySources,
} from '../lib/feed/normalize-feed-gallery-urls';
import { sanitizeFeedMediaUrl } from '../lib/feed/sanitize-feed-response-media';
import { FEED_RECIRC_MIN_SPACING, FEED_RECIRC_PAINT_CAP } from '../lib/feed/feed-composition-policy';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

/** Mirror pickPrimaryImageUrl cover selection without importing feedMedia/React. */
function pickCover(raw: Record<string, unknown>): string | null {
  return (
    sanitizeFeedMediaUrl(raw.photo) ||
    sanitizeFeedMediaUrl(raw.image) ||
    null
  );
}

console.log('=== Feed gallery payload hotfix v2 ===\n');

ok('FEED_RECIRC_MIN_SPACING unchanged', FEED_RECIRC_MIN_SPACING === 6);
ok('FEED_RECIRC_PAINT_CAP unchanged', FEED_RECIRC_PAINT_CAP === 40);

const geo = read('components/feed/GeoFeed.tsx');
ok(
  'normalizeFeedItem wires normalizeFeedGalleryUrls',
  geo.includes('import { normalizeFeedGalleryUrls }') &&
    geo.includes('galleryUrls: normalizeFeedGalleryUrls(raw.galleryUrls, photo)'),
);
ok(
  'toCardItem still forwards galleryUrls',
  geo.includes('galleryUrls: Array.isArray(it.galleryUrls) ? it.galleryUrls : undefined'),
);

const urls3 = [
  'https://images.unsplash.com/photo-a?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-b?auto=format&w=800&q=80',
  'https://images.unsplash.com/photo-c?auto=format&w=800&q=80',
];

// --- 3-image listing (API → normalizeFeedItem → media) ---
const api3: Record<string, unknown> = {
  id: 'c1111111-1111-4111-8111-111111111101',
  image: urls3[0],
  photo: urls3[0],
  galleryUrls: [...urls3],
};
const photo3 = pickCover(api3);
const normalized3 = normalizeFeedItemGalleryField(api3, photo3);
ok('3-image: normalizeFeedItem gallery length 3', normalized3?.length === 3);
ok(
  '3-image: order preserved',
  !!normalized3 &&
    normalized3[0] === urls3[0] &&
    normalized3[1] === urls3[1] &&
    normalized3[2] === urls3[2],
);
const media3 = resolveFeedMediaGallerySources(photo3, normalized3);
ok('3-image: feed media receives all 3', media3.length === 3);
ok('3-image: carousel controls eligible', media3.length > 1);

// --- 1-image listing ---
const api1: Record<string, unknown> = {
  id: 'one',
  image: urls3[0],
  galleryUrls: [urls3[0]],
};
const photo1 = pickCover(api1);
const normalized1 = normalizeFeedItemGalleryField(api1, photo1);
ok('1-image: gallery length 1', normalized1?.length === 1);
ok(
  '1-image: media single-image behavior',
  resolveFeedMediaGallerySources(photo1, normalized1).length === 1,
);

// --- Missing galleryUrls ---
const apiMissing: Record<string, unknown> = {
  id: 'missing',
  image: urls3[0],
};
const photoMissing = pickCover(apiMissing);
const normalizedMissing = normalizeFeedItemGalleryField(apiMissing, photoMissing);
ok(
  'missing galleryUrls: undefined (photo-only path)',
  normalizedMissing === undefined,
);
ok(
  'missing galleryUrls: media falls back to cover',
  resolveFeedMediaGallerySources(photoMissing, normalizedMissing).length === 1,
);

// --- Empty / invalid URLs ---
const apiJunk: Record<string, unknown> = {
  id: 'junk',
  image: urls3[0],
  galleryUrls: ['', 'null', 'undefined', 'ftp://bad', null, urls3[1], '  ', urls3[2]],
};
const photoJunk = pickCover(apiJunk);
const normalizedJunk = normalizeFeedItemGalleryField(apiJunk, photoJunk);
ok(
  'invalid URLs dropped; cover prepended when absent from valid list',
  !!normalizedJunk &&
    normalizedJunk.length === 3 &&
    normalizedJunk[0] === urls3[0] &&
    normalizedJunk[1] === urls3[1] &&
    normalizedJunk[2] === urls3[2],
);

const apiDup: Record<string, unknown> = {
  id: 'dup',
  image: urls3[0],
  galleryUrls: [urls3[0], urls3[0], urls3[1]],
};
ok(
  'duplicates removed; order kept',
  (() => {
    const n = normalizeFeedItemGalleryField(apiDup, pickCover(apiDup));
    return !!n && n.length === 2 && n[0] === urls3[0] && n[1] === urls3[1];
  })(),
);

// --- Recirculated listing retains galleries ---
const firstPass = normalizeFeedItemGalleryField(api3, photo3);
const recirculatedRaw: Record<string, unknown> = {
  ...api3,
  galleryUrls: firstPass,
};
const recirculated = normalizeFeedItemGalleryField(
  recirculatedRaw,
  pickCover(recirculatedRaw),
);
ok(
  'recirculated listing retains 3 galleryUrls',
  recirculated?.length === 3 &&
    resolveFeedMediaGallerySources(
      pickCover(recirculatedRaw),
      recirculated,
    ).length === 3,
);

ok(
  'cover prepended when not in galleryUrls',
  (() => {
    const n = normalizeFeedGalleryUrls([urls3[1], urls3[2]], urls3[0]);
    return !!n && n[0] === urls3[0] && n.length === 3;
  })(),
);

console.log(`\n${passed} assertions passed`);
