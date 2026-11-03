#!/usr/bin/env npx tsx
/**
 * Lightweight carousel + V2 click guards (memory-safe).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FEED_RECIRC_MIN_SPACING,
  FEED_RECIRC_PAINT_CAP,
  FEED_SALE_INSPIRATION_STRIDE,
} from '../lib/feed/feed-composition-policy';
import {
  FEED_GALLERY_URL_CAP,
  sanitizeFeedItemForResponse,
} from '../lib/feed/sanitize-feed-response-media';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Feed carousel v3 (commit A) ===\n');

ok('cyclic spacing preserved', FEED_RECIRC_MIN_SPACING === 6);
ok('inspiration stride preserved', FEED_SALE_INSPIRATION_STRIDE === 4);
ok('paint cap preserved', FEED_RECIRC_PAINT_CAP === 40);
ok('gallery cap bounded', FEED_GALLERY_URL_CAP > 1 && FEED_GALLERY_URL_CAP <= 12);

const multi = sanitizeFeedItemForResponse({
  id: 'g1',
  image: 'https://cdn.example.com/a.jpg',
  images: [
    'https://cdn.example.com/a.jpg',
    'https://cdn.example.com/b.jpg',
    'https://cdn.example.com/c.jpg',
  ],
});
ok(
  'sanitize keeps ordered galleryUrls',
  Array.isArray(multi.galleryUrls) && multi.galleryUrls.length === 3,
);
ok('cover remains first photo', multi.image === 'https://cdn.example.com/a.jpg');
ok(
  'heavy media arrays still stripped',
  !('images' in multi) && !('ListingMedia' in multi),
);

const media = read('components/feed/feedMedia.tsx');
ok(
  'photo click opens fullscreen at current index',
  media.includes('feed-tile:media-lightbox-image') &&
    media.includes('gallery: { sources, index: safePhotoIndex }'),
);
ok(
  'inline carousel arrows + swipe hooks present',
  media.includes('goPrevPhoto') &&
    media.includes('goNextPhoto') &&
    media.includes('data-image-slider'),
);
ok(
  'media no longer navigates to item as primary hit',
  !media.includes('Primary hit target always opens the canonical listing detail'),
);

const standard = read('components/marketplace/tiles/MarketplaceTileStandard.tsx');
ok(
  'title Link opens item detail',
  standard.includes('<Link href={model.href}'),
);
ok(
  'galleryUrls wired into TileMedia',
  standard.includes('galleryUrls={model.galleryUrls}'),
);

const person = read('components/marketplace/tiles/primitives/TilePersonRow.tsx');
ok(
  'seller avatar/name use /user/ profile href',
  person.includes('/user/') && person.includes('getPublicProfileHref'),
);

const lightbox = read('components/feed/FeedMediaLightbox.tsx');
ok(
  'fullscreen gallery supports arrows + escape',
  lightbox.includes('gallery?.sources') &&
    lightbox.includes('Escape') &&
    lightbox.includes('ChevronLeft'),
);

const geo = read('components/feed/GeoFeed.tsx');
ok(
  'GeoFeed preserves paint cap and maps galleryUrls',
  geo.includes('FEED_RECIRC_PAINT_CAP') &&
    geo.includes('galleryUrls: Array.isArray(it.galleryUrls)'),
);

console.log(`\n${passed} assertions passed`);
