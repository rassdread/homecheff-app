/**
 * Unit tests for lib/product/product-story-copy.ts
 * Run: npx tsx scripts/test-product-story-copy.ts
 */

import assert from 'node:assert/strict';
import {
  buildAboutProductBlock,
  buildEmptyReviewState,
  buildSmartMakerLine,
  buildSmartProductSummary,
  buildSmartTrustLines,
  toProductStoryInput,
} from '../lib/product/product-story-copy';

function testKeksiCheffPickup() {
  const input = toProductStoryInput({
    product: {
      title: 'Keksi',
      description: 'Luchtige cake met kaneel en rum',
      category: 'CHEFF',
      delivery: 'PICKUP',
      orderMethod: 'HOMECHEFF_PAYMENT',
      priceCents: 500,
      seller: { User: { place: 'Berkel en Rodenrijs' } },
    },
    sellerName: 'Lioness',
    checkoutAvailable: true,
  });

  const summary = buildSmartProductSummary(input);
  assert.match(summary, /Huisgemaakte keksi met kaneel en rum/i);
  assert.match(summary, /Lioness/i);
  assert.match(summary, /Berkel en Rodenrijs/i);
  assert.match(summary, /Alleen ophalen/i);

  const maker = buildSmartMakerLine(input);
  assert.match(maker, /Lioness/i);
  assert.match(maker, /Berkel en Rodenrijs/i);
}

function testCheffNoDescription() {
  const input = toProductStoryInput({
    product: {
      title: 'Appeltaart',
      category: 'CHEFF',
      delivery: 'BOTH',
      sellerCanDeliver: true,
      deliveryRadiusKm: 15,
      seller: { User: { place: 'Rotterdam' } },
    },
    sellerName: 'Jan',
  });
  const summary = buildSmartProductSummary(input);
  assert.match(summary, /Huisgemaakte appeltaart/i);
  assert.match(summary, /15 km/i);
}

function testGarden() {
  const input = toProductStoryInput({
    product: {
      title: 'Tomaten',
      description: 'Zoete cherrytomaten',
      category: 'GROWN',
      delivery: 'BOTH',
      sellerCanDeliver: true,
      seller: { User: { place: 'Vlaardingen' } },
    },
    sellerName: 'Tuinier',
  });
  const summary = buildSmartProductSummary(input);
  assert.match(summary, /Lokaal gekweekt/i);
  assert.match(summary, /Vlaardingen/i);
}

function testDesignerContact() {
  const input = toProductStoryInput({
    product: {
      title: 'Keramiek vaas',
      category: 'DESIGNER',
      orderMethod: 'CONTACT',
      priceCents: 0,
      seller: { User: { place: 'Delft' } },
    },
    sellerName: 'Studio',
  });
  const summary = buildSmartProductSummary(input);
  assert.match(summary, /handgemaakt/i);
  assert.match(summary, /contact/i);
}

function testTrustWithReviews() {
  const lines = buildSmartTrustLines(
    toProductStoryInput({
      product: { title: 'X', category: 'CHEFF', delivery: 'PICKUP' },
      sellerName: 'A',
      stats: { reviewCount: 5, averageRating: 4.8, orderCount: 10 },
      checkoutAvailable: true,
    }),
  );
  assert.ok(lines.some((l) => l.includes('4.8')));
  assert.ok(lines.length <= 2);
}

function testTrustCommunityProps() {
  const lines = buildSmartTrustLines(
    toProductStoryInput({
      product: { title: 'X', category: 'CHEFF', delivery: 'PICKUP' },
      sellerName: 'A',
      sellerTotalProps: 15,
      sellerBadgeCount: 1,
    }),
  );
  assert.ok(lines.some((l) => l.includes('15') || l.includes('Actieve maker')));
}

function testEmptyReviewSold() {
  const state = buildEmptyReviewState(
    toProductStoryInput({
      product: { title: 'X', category: 'CHEFF' },
      sellerName: 'A',
      stats: { orderCount: 3, reviewCount: 0 },
    }),
  );
  assert.match(state.primary, /3/);
}

function testEmptyReviewNew() {
  const state = buildEmptyReviewState(
    toProductStoryInput({
      product: { title: 'X', category: 'CHEFF' },
      sellerName: 'A',
    }),
  );
  assert.match(state.primary, /Nieuw aanbod/i);
}

function testAboutBlockAvoidsDuplicate() {
  const input = toProductStoryInput({
    product: {
      title: 'Keksi',
      description: 'Luchtige cake met kaneel en rum',
      category: 'CHEFF',
      tags: ['zoet'],
      subcategory: 'Gebak',
      delivery: 'PICKUP',
      seller: { User: { place: 'Berkel en Rodenrijs' } },
    },
    sellerName: 'Lioness',
  });
  const summary = buildSmartProductSummary(input);
  const about = buildAboutProductBlock(input, summary, 'Chef');
  assert.ok(about.description);
  assert.ok(about.contextLines.some((l) => l.includes('zoet')));
}

function testNoNetherlandsPlace() {
  const input = toProductStoryInput({
    product: {
      title: 'Test',
      category: 'CHEFF',
      delivery: 'PICKUP',
      seller: { User: { place: 'Nederland' } },
    },
    sellerName: 'Maker',
  });
  const maker = buildSmartMakerLine(input);
  assert.doesNotMatch(maker, /Nederland/i);
  assert.match(maker, /Gemaakt door Maker/i);
}

testKeksiCheffPickup();
testCheffNoDescription();
testGarden();
testDesignerContact();
testTrustWithReviews();
testTrustCommunityProps();
testEmptyReviewSold();
testEmptyReviewNew();
testAboutBlockAvoidsDuplicate();
testNoNetherlandsPlace();

console.log('test-product-story-copy: all passed');
