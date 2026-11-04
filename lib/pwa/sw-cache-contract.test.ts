import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { isKnownHomecheffRootPath } from '@/lib/seo/known-root-path-segments';

const source = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');

test('service worker drops the previous cache generation', () => {
  assert.match(source, /homecheff-static-v4/);
  assert.match(source, /homecheff-dynamic-v4/);
  assert.doesNotMatch(source, /homecheff-static-v3/);
});

test('live marketplace APIs are not served from cache', () => {
  assert.doesNotMatch(source, /CACHEABLE_API_ROUTES/);
  assert.match(source, /pathname\.startsWith\('\/api\/'\)/);
  const apiBlock = source.slice(source.indexOf("pathname.startsWith('/api/')"));
  assert.match(apiBlock.slice(0, 180), /return;/);
  assert.doesNotMatch(apiBlock.slice(0, 180), /cache\.match/);
});

test('images update from the network before a cached copy', () => {
  const imageBlock = source.slice(source.indexOf('Handle static assets'));
  const respond = imageBlock.slice(0, 700);
  assert.ok(respond.indexOf('fetch(request)') < respond.indexOf('caches.match'));
});

test('push deep links stay registered', () => {
  assert.match(source, /function resolvePushDeepLink/);
});

test('install does not precache unused legacy bundles', () => {
  assert.doesNotMatch(source, /\/static\/js\/bundle\.js/);
  assert.doesNotMatch(source, /\/static\/css\/main\.css/);
});

test('middleware must not rewrite the workers to the unknown-slug 404', () => {
  assert.equal(isKnownHomecheffRootPath('/sw.js'), true);
  assert.equal(isKnownHomecheffRootPath('/firebase-messaging-sw.js'), true);
  assert.equal(isKnownHomecheffRootPath('/manifest.json'), true);
});
