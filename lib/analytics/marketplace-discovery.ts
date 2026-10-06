/**
 * One consented GA4 signal: the visitor used Marketplace discovery
 * and the marketplace finished evaluating that choice.
 *
 * The payload is a closed set of labels. The search text is hashed only
 * inside this process so two different searches do not collapse, and that
 * hash is never returned.
 */

import { analyticsConsentGranted, ANALYTICS_CONSENT_KEY } from '@/lib/meta/commerce';
import { normalizeDiscoveryCategorySlug } from '@/lib/marketplace/canonical-model';

export const MARKETPLACE_DISCOVERY_EVENT = 'marketplace_discovery' as const;

export const MARKETPLACE_FAMILIES = ['all', 'food', 'garden', 'creation', 'service'] as const;
export const DISCOVERY_SCOPES = ['nearby', 'national', 'international'] as const;
export const RESULT_BUCKETS = ['zero', '1_5', '6_20', '21_plus'] as const;
export const DISCOVERY_MODES = ['search', 'category', 'filter', 'location', 'combined'] as const;

export type MarketplaceFamily = (typeof MARKETPLACE_FAMILIES)[number];
export type DiscoveryScope = (typeof DISCOVERY_SCOPES)[number];
export type ResultBucket = (typeof RESULT_BUCKETS)[number];
export type DiscoveryMode = (typeof DISCOVERY_MODES)[number];

export type MarketplaceDiscoveryParams = {
  marketplace_family: MarketplaceFamily;
  result_bucket: ResultBucket;
  scope: DiscoveryScope;
  discovery_mode: DiscoveryMode;
};

export type MarketplaceDiscoveryEvent = {
  name: typeof MARKETPLACE_DISCOVERY_EVENT;
  params: MarketplaceDiscoveryParams;
};

type Criteria = {
  family: MarketplaceFamily;
  scope: DiscoveryScope;
  filter: boolean;
  queryHash: string;
  /** View chip. Stays off the event payload. */
  view: string;
};

export type DiscoveryMemory = Criteria & {
  sealed: boolean;
};

export const EMPTY_DISCOVERY_MEMORY: DiscoveryMemory = {
  sealed: false,
  family: 'all',
  scope: 'nearby',
  filter: false,
  queryHash: '0',
  view: 'all',
};

export type DiscoveryObservation = {
  userInitiated: boolean;
  phase: 'pending' | 'ready' | 'error';
  knownCount: number | null;
  /** True only when a finished evaluation found no matches. */
  certifiedZero: boolean;
  categorySlug: string;
  feedScope: string;
  /** Used for the local hash. Never copied onto the event. */
  searchText: string;
  filterActive: boolean;
  /** Aangeboden, Vraag, Inspiratie, or Alles. Not sent to analytics. */
  viewChip?: string | null;
};

export type DiscoveryDecision = {
  memory: DiscoveryMemory;
  event: MarketplaceDiscoveryEvent | null;
  consumeIntent: boolean;
};

const PASSIVE_CRITERIA: Criteria = {
  family: 'all',
  scope: 'nearby',
  filter: false,
  queryHash: '0',
  view: 'all',
};

export function marketplaceFamilyFromCategorySlug(slug: string | null | undefined): MarketplaceFamily {
  const normalized = normalizeDiscoveryCategorySlug(slug);
  if (normalized === 'cheff') return 'food';
  if (normalized === 'garden') return 'garden';
  if (normalized === 'designer') return 'creation';
  if (normalized === 'services') return 'service';
  return 'all';
}

export function discoveryScopeFromFeedScope(scope: string | null | undefined): DiscoveryScope {
  const value = (scope || '').trim().toLowerCase();
  if (value === 'nearby' || value === 'local') return 'nearby';
  if (value === 'international' || value === 'worldwide' || value === 'global') {
    return 'international';
  }
  return 'national';
}

/** Buckets of the known evaluated count, not an unseen catalog total. */
export function resultBucketFromKnownCount(count: number): ResultBucket {
  if (count <= 0) return 'zero';
  if (count <= 5) return '1_5';
  if (count <= 20) return '6_20';
  return '21_plus';
}

/** Local-only identity of the typed text. Not a payload field. */
export function localQueryFingerprint(raw: string): string {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return '0';
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function criteriaOf(observation: DiscoveryObservation): Criteria {
  return {
    family: marketplaceFamilyFromCategorySlug(observation.categorySlug),
    scope: discoveryScopeFromFeedScope(observation.feedScope),
    filter: observation.filterActive,
    queryHash: localQueryFingerprint(observation.searchText),
    view: (observation.viewChip || 'all').trim().toLowerCase() || 'all',
  };
}

function discoveryMode(previous: Criteria, next: Criteria): DiscoveryMode | null {
  const changed: DiscoveryMode[] = [];
  if (previous.queryHash !== next.queryHash) changed.push('search');
  if (previous.family !== next.family) changed.push('category');
  if (previous.scope !== next.scope) changed.push('location');
  if (previous.filter !== next.filter || previous.view !== next.view) changed.push('filter');
  if (changed.length === 0) return null;
  if (changed.length === 1) return changed[0];
  return 'combined';
}

function sameCriteria(left: Criteria, right: Criteria): boolean {
  return (
    left.family === right.family &&
    left.scope === right.scope &&
    left.filter === right.filter &&
    left.queryHash === right.queryHash &&
    left.view === right.view
  );
}

function eventFor(criteria: Criteria, mode: DiscoveryMode, bucket: ResultBucket): MarketplaceDiscoveryEvent | null {
  if (
    !MARKETPLACE_FAMILIES.includes(criteria.family) ||
    !DISCOVERY_SCOPES.includes(criteria.scope) ||
    !DISCOVERY_MODES.includes(mode) ||
    !RESULT_BUCKETS.includes(bucket)
  ) {
    return null;
  }
  return {
    name: MARKETPLACE_DISCOVERY_EVENT,
    params: {
      marketplace_family: criteria.family,
      result_bucket: bucket,
      scope: criteria.scope,
      discovery_mode: mode,
    },
  };
}

/**
 * A category click can finish in one render: the feed never paints a
 * separate "loading" frame, so a gate that waits to see that frame drops
 * the event after the new results are already visible.
 * Wait only while a server choice has not landed yet.
 */
export function resolveDiscoveryPhase(input: {
  failed: boolean;
  idle: boolean;
  userInitiated: boolean;
  awaitingServerResults: boolean;
}): 'pending' | 'ready' | 'error' {
  if (input.failed) return 'error';
  if (!input.idle) return 'pending';
  if (input.userInitiated && input.awaitingServerResults) return 'pending';
  return 'ready';
}

export function noteDiscoveryOutcome(
  memory: DiscoveryMemory,
  observation: DiscoveryObservation,
): DiscoveryDecision {
  if (observation.phase === 'pending' || observation.phase === 'error') {
    return { memory, event: null, consumeIntent: false };
  }

  const next = criteriaOf(observation);
  const sealedMemory: DiscoveryMemory = { ...next, sealed: true };

  if (!observation.userInitiated) {
    if (!memory.sealed || !sameCriteria(memory, next)) {
      return { memory: sealedMemory, event: null, consumeIntent: false };
    }
    return { memory, event: null, consumeIntent: false };
  }

  const previous = memory.sealed ? memory : PASSIVE_CRITERIA;
  const mode = discoveryMode(previous, next);
  if (!mode || (memory.sealed && sameCriteria(memory, next))) {
    return { memory: memory.sealed ? memory : sealedMemory, event: null, consumeIntent: true };
  }

  const count = observation.knownCount;
  if (count == null || !Number.isFinite(count) || count < 0) {
    return { memory, event: null, consumeIntent: false };
  }
  if (count === 0 && !observation.certifiedZero) {
    return { memory, event: null, consumeIntent: false };
  }

  const bucket = count === 0 ? 'zero' : resultBucketFromKnownCount(count);
  const event = eventFor(next, mode, bucket);
  if (!event) {
    return { memory, event: null, consumeIntent: false };
  }
  return { memory: sealedMemory, event, consumeIntent: true };
}

export function browserAnalyticsConsentGranted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return analyticsConsentGranted(window.localStorage.getItem(ANALYTICS_CONSENT_KEY));
  } catch {
    return false;
  }
}

export function emitMarketplaceDiscovery(
  event: MarketplaceDiscoveryEvent | null,
  analyticsConsent: boolean,
  send: (name: string, params: MarketplaceDiscoveryParams) => void,
): boolean {
  if (!analyticsConsent || !event || event.name !== MARKETPLACE_DISCOVERY_EVENT) return false;
  const params = event.params;
  if (
    !MARKETPLACE_FAMILIES.includes(params.marketplace_family) ||
    !DISCOVERY_SCOPES.includes(params.scope) ||
    !RESULT_BUCKETS.includes(params.result_bucket) ||
    !DISCOVERY_MODES.includes(params.discovery_mode)
  ) {
    return false;
  }
  send(MARKETPLACE_DISCOVERY_EVENT, {
    marketplace_family: params.marketplace_family,
    result_bucket: params.result_bucket,
    scope: params.scope,
    discovery_mode: params.discovery_mode,
  });
  return true;
}
