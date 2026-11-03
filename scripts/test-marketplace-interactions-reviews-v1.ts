#!/usr/bin/env npx tsx
/**
 * Marketplace interactions + experience-review eligibility regressions.
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
  EXPERIENCE_REVIEW_DAILY_LIMIT,
  experienceReviewContentAllowed,
  resolveProductReviewVerification,
} from '../lib/reviews/product-review-eligibility';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Marketplace interactions + reviews v1 ===\n');

ok('cyclic spacing preserved', FEED_RECIRC_MIN_SPACING === 6);
ok('inspiration stride preserved', FEED_SALE_INSPIRATION_STRIDE === 4);
ok('paint cap bounds recirculation DOM', FEED_RECIRC_PAINT_CAP > 0 && FEED_RECIRC_PAINT_CAP <= 120);

const geo = read('components/feed/GeoFeed.tsx');
ok(
  'GeoFeed trims recirculated paint with FEED_RECIRC_PAINT_CAP',
  geo.includes('FEED_RECIRC_PAINT_CAP') &&
    geo.includes('merged.slice(merged.length - FEED_RECIRC_PAINT_CAP)'),
);
ok(
  'sellerUserId never uses SellerProfile.id alone',
  geo.includes('Never use SellerProfile.id') &&
    !/sellerUserId\s*=\s*[\s\S]{0,200}seller\?\.id \? String\(seller\.id\)/.test(geo),
);

const feedRoute = read('app/api/feed/route.ts');
ok(
  'feed extractSellerUserId ignores SellerProfile.id fallback',
  feedRoute.includes('Do not fall back to SellerProfile.id') &&
    feedRoute.includes('seller?.User?.id'),
);

const media = read('components/feed/feedMedia.tsx');
ok(
  'feed media primary hit target is listing Link',
  media.includes('Primary hit target always opens the canonical listing detail') &&
    media.includes('navDebug("feed-tile:media-link"'),
);
ok(
  'mobile lightbox is secondary control, not full-card overlay',
  media.includes('lightboxEligible && hasOpenableLightboxMedia') &&
    media.indexOf('<Link') < media.indexOf('lightboxEligible && hasOpenableLightboxMedia'),
);

ok(
  'purchase → verified transaction',
  resolveProductReviewVerification({ hasPurchasedOrder: true }) ===
    'VERIFIED_TRANSACTION',
);
ok(
  'no purchase → unverified experience',
  resolveProductReviewVerification({ hasPurchasedOrder: false }) ===
    'UNVERIFIED_EXPERIENCE',
);
ok(
  'experience review requires short note',
  !experienceReviewContentAllowed({
    kind: 'UNVERIFIED_EXPERIENCE',
    comment: 'kort',
  }).ok,
);
ok(
  'experience review accepts meaningful note',
  experienceReviewContentAllowed({
    kind: 'UNVERIFIED_EXPERIENCE',
    comment: 'Opgehaald contant, goed product.',
  }).ok,
);
ok(
  'verified review allows empty comment',
  experienceReviewContentAllowed({
    kind: 'VERIFIED_TRANSACTION',
    comment: '',
  }).ok,
);
ok('experience daily limit configured', EXPERIENCE_REVIEW_DAILY_LIMIT >= 3);

const reviewsApi = read('app/api/products/[id]/reviews/route.ts');
ok(
  'product reviews no longer hard-require purchase',
  !reviewsApi.includes('You must purchase this product before you can review it'),
);
ok(
  'product reviews block self-review',
  reviewsApi.includes('Je kunt je eigen aanbod niet beoordelen'),
);
ok(
  'HCP awards gated to verified reviews',
  reviewsApi.includes("if (isVerified)") &&
    reviewsApi.includes('tryAwardReviewReceivedHcp'),
);

const dorpsplein = read('app/api/dorpsplein/products/[id]/reviews/route.ts');
ok(
  'dorpsplein reviews allow experience path',
  !dorpsplein.includes(
    'Je moet dit product eerst kopen voordat je een review kunt plaatsen',
  ),
);

const reviewItem = read('components/reviews/ReviewItem.tsx');
ok(
  'UI distinguishes experience reviews',
  reviewItem.includes('Ervaring (niet via HomeCheff-bestelling)'),
);

const dorpspleinUi = read('components/dorpsplein/ProductReviewSection.tsx');
ok(
  'dorpsplein UI no longer locks review behind purchase',
  !dorpspleinUi.includes('Koop eerst dit product') &&
    dorpspleinUi.includes('als ervaring gemarkeerd'),
);

console.log(`\n✅ ${passed} checks passed`);
