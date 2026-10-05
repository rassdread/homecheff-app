import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { META_APPROVED_EVENTS } from '@/lib/meta/commerce';
import {
  EMPTY_DISCOVERY_MEMORY,
  browserAnalyticsConsentGranted,
  emitMarketplaceDiscovery,
  localQueryFingerprint,
  noteDiscoveryOutcome,
  type DiscoveryMemory,
  type DiscoveryObservation,
  type MarketplaceDiscoveryEvent,
} from './marketplace-discovery';

const SENSITIVE = 'john@example.com 0612345678';

function obs(patch: Partial<DiscoveryObservation> = {}): DiscoveryObservation {
  return {
    userInitiated: false,
    phase: 'ready',
    knownCount: 8,
    certifiedZero: false,
    categorySlug: 'all',
    feedScope: 'nearby',
    searchText: '',
    filterActive: false,
    ...patch,
  };
}

function run(
  memory: DiscoveryMemory,
  patch: Partial<DiscoveryObservation>,
): { memory: DiscoveryMemory; event: MarketplaceDiscoveryEvent | null; consumeIntent: boolean } {
  return noteDiscoveryOutcome(memory, obs(patch));
}

describe('marketplace discovery', () => {
  it('does not count the passive first feed', () => {
    const first = run(EMPTY_DISCOVERY_MEMORY, { knownCount: 10 });
    assert.equal(first.event, null);
    assert.equal(first.memory.sealed, true);
    const again = run(first.memory, { knownCount: 10 });
    assert.equal(again.event, null);
  });

  it('counts one executed search with results', () => {
    const sealed = run(EMPTY_DISCOVERY_MEMORY, {}).memory;
    const found = run(sealed, {
      userInitiated: true,
      searchText: 'soup',
      knownCount: 4,
    });
    assert.equal(found.event?.name, 'marketplace_discovery');
    assert.equal(found.event?.params.discovery_mode, 'search');
    assert.equal(found.event?.params.result_bucket, '1_5');
    assert.equal(found.event?.params.marketplace_family, 'all');
    const repeat = run(found.memory, {
      userInitiated: true,
      searchText: 'soup',
      knownCount: 4,
    });
    assert.equal(repeat.event, null);
  });

  it('counts a certified empty result as zero and ignores an error', () => {
    const sealed = run(EMPTY_DISCOVERY_MEMORY, {}).memory;
    const empty = run(sealed, {
      userInitiated: true,
      searchText: 'nothing-here',
      knownCount: 0,
      certifiedZero: true,
    });
    assert.equal(empty.event?.params.result_bucket, 'zero');

    const errored = run(sealed, {
      userInitiated: true,
      searchText: 'nothing-here',
      phase: 'error',
      knownCount: 0,
      certifiedZero: false,
    });
    assert.equal(errored.event, null);
    assert.equal(errored.consumeIntent, false);
  });

  it('does not call an unfinished empty page a zero result', () => {
    const sealed = run(EMPTY_DISCOVERY_MEMORY, {}).memory;
    const partial = run(sealed, {
      userInitiated: true,
      searchText: 'later',
      knownCount: 0,
      certifiedZero: false,
    });
    assert.equal(partial.event, null);
    assert.equal(partial.consumeIntent, false);
  });

  it('maps category families and geographic scope', () => {
    let memory = run(EMPTY_DISCOVERY_MEMORY, {}).memory;
    const food = run(memory, { userInitiated: true, categorySlug: 'cheff', knownCount: 6 });
    assert.equal(food.event?.params.marketplace_family, 'food');
    assert.equal(food.event?.params.discovery_mode, 'category');
    assert.equal(food.event?.params.result_bucket, '6_20');

    memory = food.memory;
    const garden = run(memory, { userInitiated: true, categorySlug: 'tuin', knownCount: 2 });
    assert.equal(garden.event?.params.marketplace_family, 'garden');

    memory = garden.memory;
    const creation = run(memory, { userInitiated: true, categorySlug: 'designer', knownCount: 22 });
    assert.equal(creation.event?.params.marketplace_family, 'creation');
    assert.equal(creation.event?.params.result_bucket, '21_plus');

    memory = creation.memory;
    const service = run(memory, { userInitiated: true, categorySlug: 'diensten', knownCount: 3 });
    assert.equal(service.event?.params.marketplace_family, 'service');
    assert.notEqual(service.event?.params.marketplace_family, 'chef');

    memory = service.memory;
    const national = run(memory, {
      userInitiated: true,
      categorySlug: 'diensten',
      feedScope: 'national',
      knownCount: 9,
    });
    assert.equal(national.event?.params.scope, 'national');
    assert.equal(national.event?.params.discovery_mode, 'location');

    const international = run(national.memory, {
      userInitiated: true,
      categorySlug: 'diensten',
      feedScope: 'international',
      knownCount: 9,
    });
    assert.equal(international.event?.params.scope, 'international');

    const nearby = run(international.memory, {
      userInitiated: true,
      categorySlug: 'diensten',
      feedScope: 'nearby',
      knownCount: 9,
    });
    assert.equal(nearby.event?.params.scope, 'nearby');
  });

  it('ignores another page and a rerender of the same choice', () => {
    const sealed = run(EMPTY_DISCOVERY_MEMORY, { categorySlug: 'cheff' }).memory;
    const paged = run(sealed, { categorySlug: 'cheff', knownCount: 20, userInitiated: false });
    assert.equal(paged.event, null);
    const rerender = run(sealed, { categorySlug: 'cheff', knownCount: 8, userInitiated: false });
    assert.equal(rerender.event, null);
  });

  it('does not count restored filters, and does count a later change', () => {
    const restored = run(EMPTY_DISCOVERY_MEMORY, {
      userInitiated: false,
      searchText: 'saved query',
      categorySlug: 'garden',
      feedScope: 'national',
      knownCount: 5,
    });
    assert.equal(restored.event, null);
    assert.equal(restored.memory.sealed, true);
    const sameAgain = run(restored.memory, {
      userInitiated: false,
      searchText: 'saved query',
      categorySlug: 'garden',
      feedScope: 'national',
      knownCount: 5,
    });
    assert.equal(sameAgain.event, null);
    const changed = run(restored.memory, {
      userInitiated: true,
      searchText: 'saved query',
      categorySlug: 'services',
      feedScope: 'national',
      knownCount: 1,
    });
    assert.equal(changed.event?.params.marketplace_family, 'service');
    assert.equal(changed.event?.params.discovery_mode, 'category');
  });

  it('keeps the sensitive query out of the payload for anonymous and signed-in visitors', () => {
    const sealed = run(EMPTY_DISCOVERY_MEMORY, {}).memory;
    const found = run(sealed, {
      userInitiated: true,
      searchText: SENSITIVE,
      knownCount: 2,
    });
    const encoded = JSON.stringify(found.event);
    assert.equal(encoded.includes('john'), false);
    assert.equal(encoded.includes('example.com'), false);
    assert.equal(encoded.includes('0612345678'), false);
    assert.equal(encoded.includes('@'), false);
    assert.equal(encoded.includes(localQueryFingerprint(SENSITIVE)), false);
    assert.deepEqual(Object.keys(found.event?.params ?? {}).sort(), [
      'discovery_mode',
      'marketplace_family',
      'result_bucket',
      'scope',
    ]);
    const signedIn = run(sealed, {
      userInitiated: true,
      searchText: SENSITIVE,
      knownCount: 2,
    });
    assert.deepEqual(signedIn.event?.params, found.event?.params);
  });

  it('sends only after analytics consent', () => {
    const sealed = run(EMPTY_DISCOVERY_MEMORY, {}).memory;
    const event = run(sealed, { userInitiated: true, categorySlug: 'cheff', knownCount: 3 }).event;
    const sent: unknown[] = [];
    const sink = (name: string, params: unknown) => {
      sent.push({ name, params });
    };
    assert.equal(emitMarketplaceDiscovery(event, false, sink), false);
    assert.equal(sent.length, 0);
    assert.equal(emitMarketplaceDiscovery(event, true, sink), true);
    assert.equal(sent.length, 1);
    assert.equal(browserAnalyticsConsentGranted(), false);
  });

  it('is not a Meta event', () => {
    assert.equal(META_APPROVED_EVENTS.includes('marketplace_discovery' as never), false);
    assert.deepEqual([...META_APPROVED_EVENTS], ['CompleteRegistration', 'Purchase']);
    const browser = readFileSync(new URL('../meta/browser.ts', import.meta.url), 'utf8');
    const commerce = readFileSync(new URL('../meta/commerce.ts', import.meta.url), 'utf8');
    const discovery = readFileSync(new URL('./marketplace-discovery.ts', import.meta.url), 'utf8');
    assert.equal(browser.includes('marketplace_discovery'), false);
    assert.equal(commerce.includes('marketplace_discovery'), false);
    assert.equal(discovery.includes('fbq'), false);
    assert.equal(discovery.includes('search_term'), false);
  });
});
