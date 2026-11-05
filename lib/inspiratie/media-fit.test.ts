import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getCardMediaFitMode,
  readCachedImageAspectRatio,
  rememberImageAspectRatio,
  subscribeImageAspectRatio,
} from '@/lib/inspiratie/media-fit';

test('a displayed photo records its ratio without another download', () => {
  const url = 'https://example.test/marketplace-photo-a.jpg';
  assert.equal(readCachedImageAspectRatio(url), null);
  assert.equal(getCardMediaFitMode(readCachedImageAspectRatio(url)), 'contain');

  let notices = 0;
  const stop = subscribeImageAspectRatio(url, () => {
    notices += 1;
  });
  rememberImageAspectRatio(url, 457, 437);
  assert.equal(notices, 1);
  assert.equal(getCardMediaFitMode(readCachedImageAspectRatio(url)), 'cover');
  rememberImageAspectRatio(url, 457, 437);
  assert.equal(notices, 1);
  rememberImageAspectRatio('https://example.test/other.jpg', 0, 100);
  assert.equal(readCachedImageAspectRatio('https://example.test/other.jpg'), null);
  stop();
});

test('portrait and wide photos keep their contain fit', () => {
  assert.equal(getCardMediaFitMode(0.56), 'contain');
  assert.equal(getCardMediaFitMode(1.87), 'contain');
  assert.equal(getCardMediaFitMode(1.05), 'cover');
});

test('marketplace tiles measure the visible image and keep lazy loading', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
  const hook = readFileSync(join(root, 'hooks/useSmartMediaFit.ts'), 'utf8');
  const feed = readFileSync(join(root, 'components/feed/feedMedia.tsx'), 'utf8');
  assert.equal(hook.includes('loadImageAspectRatio'), false);
  assert.match(hook, /readCachedImageAspectRatio/);
  assert.match(feed, /rememberImageAspectFromElement/);
  assert.match(feed, /loading=\{imageLoading\}/);
});
