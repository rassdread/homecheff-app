import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyFeedPhotoGesture,
  collectFeedPhotoUrls,
  feedPhotoIndexAfterMove,
  feedPhotoStepFromSwipe,
} from './feed-photo-gallery';
import { sanitizeFeedItemForResponse } from './sanitize-feed-response-media';

test('feed response keeps every safe photo and drops inline data', () => {
  const inline = 'data:image/jpeg;base64,' + 'A'.repeat(40);
  const sanitized = sanitizeFeedItemForResponse({
    image: inline,
    images: [inline, 'https://cdn.example/a.jpg', 'https://cdn.example/b.jpg', 'https://cdn.example/a.jpg'],
    ListingMedia: [{ url: 'https://cdn.example/c.jpg' }],
  });
  assert.deepEqual(sanitized.images, [
    'https://cdn.example/a.jpg',
    'https://cdn.example/b.jpg',
    'https://cdn.example/c.jpg',
  ]);
  assert.equal(sanitized.image, 'https://cdn.example/a.jpg');
  assert.equal('ListingMedia' in sanitized, false);
});

test('one stored photo does not invent a second slide', () => {
  assert.deepEqual(
    collectFeedPhotoUrls({ image: 'https://cdn.example/only.jpg' }),
    ['https://cdn.example/only.jpg'],
  );
});

test('photo position stays on the same card when the list is unchanged', () => {
  const first = collectFeedPhotoUrls({
    images: ['https://cdn.example/1.jpg', 'https://cdn.example/2.jpg', 'https://cdn.example/3.jpg'],
  });
  const afterLoadMore = collectFeedPhotoUrls({
    images: ['https://cdn.example/1.jpg', 'https://cdn.example/2.jpg', 'https://cdn.example/3.jpg'],
  });
  assert.equal(first.join('\n'), afterLoadMore.join('\n'));
  assert.equal(feedPhotoIndexAfterMove(1, first.length, 1), 2);
  assert.equal(feedPhotoIndexAfterMove(0, first.length, -1), 0);
  assert.equal(feedPhotoIndexAfterMove(2, first.length, 1), 2);
});

test('horizontal swipe changes the photo and vertical movement does not', () => {
  assert.equal(classifyFeedPhotoGesture(4, 3), 'none');
  assert.equal(feedPhotoStepFromSwipe(-60, 4), 1);
  assert.equal(feedPhotoStepFromSwipe(60, 4), -1);
  assert.equal(feedPhotoStepFromSwipe(10, 40), 0);
  assert.equal(feedPhotoStepFromSwipe(20, 4), 0);
});
