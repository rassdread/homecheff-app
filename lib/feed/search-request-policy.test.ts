import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MARKETPLACE_SEARCH_DEBOUNCE_MS,
  shouldLoadUnfilteredDiscovery,
} from '@/lib/feed/search-request-policy';

test('search debounce coalesces a word without holding the result', () => {
  assert.ok(MARKETPLACE_SEARCH_DEBOUNCE_MS > 0);
  assert.ok(MARKETPLACE_SEARCH_DEBOUNCE_MS <= 150);
});

test('a text search does not load the unfiltered discovery feed', () => {
  assert.equal(shouldLoadUnfilteredDiscovery('pasta'), false);
  assert.equal(shouldLoadUnfilteredDiscovery('  taart  '), false);
  assert.equal(shouldLoadUnfilteredDiscovery(''), true);
  assert.equal(shouldLoadUnfilteredDiscovery('   '), true);
});
