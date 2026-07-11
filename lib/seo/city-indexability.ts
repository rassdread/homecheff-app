import type { EcosystemHubPayload } from '@/lib/community/getEcosystemHubForCitySlug';

/** Minimum active makers (7d) before a city hub may be indexed. */
export const CITY_INDEX_MIN_ACTIVE_CREATORS = 3;

/** Minimum new listings + inspiration (7d) in radius before index. */
export const CITY_INDEX_MIN_NEW_ACTIVITY = 8;

/**
 * Phase 13Q — honest city SEO: sparse or empty regions get noindex.
 * Aligns with Phase 13P threshold recommendations.
 */
export function shouldIndexCityHub(hub: EcosystemHubPayload | null): boolean {
  if (!hub) return false;
  if (hub.sparseGeoSignal) return false;
  if (hub.activeCreatorsWeek < CITY_INDEX_MIN_ACTIVE_CREATORS) return false;
  const activity = hub.newListingsWeek + hub.newInspirationWeek;
  if (activity < CITY_INDEX_MIN_NEW_ACTIVITY) return false;
  return true;
}
