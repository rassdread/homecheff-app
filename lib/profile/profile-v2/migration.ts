import type { ProfileV2TabId, ProfileV2InspiratieFilter } from './types';

/** Legacy top-level tab IDs → Profile V2 tab. */
const LEGACY_TAB_MAP: Record<string, ProfileV2TabId> = {
  overview: 'overview',
  workspace: 'vertrouwen',
  reviews: 'community',
  fans: 'community',
  'dishes-chef': 'aanbod',
  'dishes-garden': 'aanbod',
  'dishes-designer': 'aanbod',
  dishes: 'aanbod',
  ambassador: 'community',
  'business-overview': 'overview',
  subscription: 'overview',
  analytics: 'overview',
  producten: 'aanbod',
  products: 'aanbod',
  recipes: 'inspiratie',
  garden: 'inspiratie',
  designs: 'inspiratie',
  follows: 'community',
};

/**
 * Map legacy ?tab= or persisted tab id to Profile V2 tab.
 * Sub-tabs (dorpsplein/inspiratie) stay in session state separately.
 */
export function migrateLegacyProfileTab(
  legacyTab: string | null | undefined,
): ProfileV2TabId {
  if (!legacyTab || typeof legacyTab !== 'string') return 'overview';
  const key = legacyTab.trim().toLowerCase();
  return LEGACY_TAB_MAP[key] ?? 'overview';
}

/** Legacy inspiratie sub-tabs → vertical filter (for ?edit= deep links). */
export function legacyTabToInspiratieVertical(
  legacyTab: string | null | undefined,
): ProfileV2InspiratieFilter | null {
  if (!legacyTab || typeof legacyTab !== 'string') return null;
  const key = legacyTab.trim().toLowerCase();
  if (key === 'recipes' || key === 'dishes-chef') return 'chef';
  if (key === 'garden' || key === 'dishes-garden') return 'garden';
  if (key === 'designs' || key === 'dishes-designer') return 'designer';
  return null;
}

/** Persist key for Profile V2 tab state */
export const PROFILE_V2_SURFACE_ID = 'profile_v2' as const;
