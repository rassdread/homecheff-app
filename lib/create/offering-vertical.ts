/**
 * Unified vertical/type mapping for Profile V2 create/edit flows.
 * Single source for chef/garden/designer + future offering types.
 */

import type { ProfileV2AanbodFilter, ProfileV2InspiratieFilter } from '@/lib/profile/profile-v2/types';

/** DB / API product category (Prisma uses GROWN for garden). */
export type OfferingDbCategory = 'CHEFF' | 'GROWN' | 'DESIGNER';

/** Create flow / compact forms API category. */
export type OfferingFormCategory = 'CHEFF' | 'GARDEN' | 'DESIGNER';

/** Profile filter slug (chef | garden | designer). */
export type OfferingProfileSlug = 'chef' | 'garden' | 'designer';

/** Inspiratie workspace location (managers). */
export type InspiratieWorkspace = 'keuken' | 'tuin' | 'atelier';

/** Future Profile V2 aanbod types (UI-ready, backend TBD). */
export type FutureOfferingType = 'service' | 'swap' | 'request' | 'task';

export type UnifiedOfferingType = OfferingProfileSlug | FutureOfferingType;

const PROFILE_SLUGS: OfferingProfileSlug[] = ['chef', 'garden', 'designer'];

export function isOfferingProfileSlug(v: string): v is OfferingProfileSlug {
  return PROFILE_SLUGS.includes(v as OfferingProfileSlug);
}

/** CHEFF | GARDEN | DESIGNER (create intent) → profile slug */
export function createVerticalToProfileSlug(
  vertical: string | null | undefined,
): OfferingProfileSlug | null {
  if (!vertical) return null;
  const v = vertical.toUpperCase();
  if (v === 'CHEFF' || v === 'CHEF') return 'chef';
  if (v === 'GARDEN' || v === 'GROWN') return 'garden';
  if (v === 'DESIGNER' || v === 'DESIGN') return 'designer';
  const lower = vertical.toLowerCase();
  if (isOfferingProfileSlug(lower)) return lower;
  return null;
}

/** Profile slug → create flow vertical */
export function profileSlugToCreateVertical(
  slug: OfferingProfileSlug,
): 'CHEFF' | 'GARDEN' | 'DESIGNER' {
  if (slug === 'chef') return 'CHEFF';
  if (slug === 'garden') return 'GARDEN';
  return 'DESIGNER';
}

/** DB category → form category (GROWN → GARDEN) */
export function dbCategoryToFormCategory(
  category: string | null | undefined,
): OfferingFormCategory | null {
  if (!category) return null;
  const c = category.toUpperCase();
  if (c === 'CHEFF') return 'CHEFF';
  if (c === 'GROWN' || c === 'GARDEN') return 'GARDEN';
  if (c === 'DESIGNER') return 'DESIGNER';
  return null;
}

/** Form/API category → DB filter category */
export function formCategoryToDbCategory(
  category: OfferingFormCategory,
): OfferingDbCategory {
  if (category === 'GARDEN') return 'GROWN';
  return category;
}

/** Profile slug → DB category for ProductManagement filter */
export function profileSlugToDbCategory(
  slug: OfferingProfileSlug,
): OfferingDbCategory {
  if (slug === 'chef') return 'CHEFF';
  if (slug === 'garden') return 'GROWN';
  return 'DESIGNER';
}

export function profileSlugToInspiratieWorkspace(
  slug: OfferingProfileSlug,
): InspiratieWorkspace {
  if (slug === 'chef') return 'keuken';
  if (slug === 'garden') return 'tuin';
  return 'atelier';
}

export function inspiratieWorkspaceToProfileSlug(
  workspace: InspiratieWorkspace,
): OfferingProfileSlug {
  if (workspace === 'keuken') return 'chef';
  if (workspace === 'tuin') return 'garden';
  return 'designer';
}

/** Legacy inspiratie location ids (quick-add) → profile slug */
export function inspiratieLocationIdToProfileSlug(
  location: string,
): OfferingProfileSlug | null {
  const map: Record<string, OfferingProfileSlug> = {
    recepten: 'chef',
    keuken: 'chef',
    kweken: 'garden',
    tuin: 'garden',
    designs: 'designer',
    atelier: 'designer',
  };
  return map[location] ?? null;
}

/** Parse ?vertical= or ?filter= from profile URL */
export function parseProfileVerticalParam(
  value: string | string[] | undefined,
): OfferingProfileSlug | null {
  const raw = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined;
  if (!raw) return null;
  if (isOfferingProfileSlug(raw)) return raw;
  return createVerticalToProfileSlug(raw);
}

export function profileSlugToAanbodFilter(
  slug: OfferingProfileSlug | null,
): ProfileV2AanbodFilter {
  if (!slug) return 'all';
  return slug;
}

export function profileSlugToInspiratieFilter(
  slug: OfferingProfileSlug | null,
): ProfileV2InspiratieFilter {
  if (!slug) return 'all';
  return slug;
}

/** Live aanbod filters — vertical + ListingKind type filters. */
export const PROFILE_V2_LIVE_AANBOD_FILTERS = [
  'all',
  'chef',
  'garden',
  'designer',
  'products',
  'services',
  'tasks',
  'workshops',
  'coaching',
  'trade',
  'help',
] as const satisfies readonly ProfileV2AanbodFilter[];

export function isLiveAanbodFilter(
  filter: string | null | undefined,
): filter is ProfileV2AanbodFilter {
  return PROFILE_V2_LIVE_AANBOD_FILTERS.includes(filter as ProfileV2AanbodFilter);
}

export function sanitizeAanbodFilter(
  filter: ProfileV2AanbodFilter | null | undefined,
): ProfileV2AanbodFilter {
  if (filter && isLiveAanbodFilter(filter)) return filter;
  return 'all';
}

/** Public detail route segment for inspiration dish */
export function profileSlugToInspirationPathPrefix(
  slug: OfferingProfileSlug,
): 'recipe' | 'garden' | 'design' {
  if (slug === 'chef') return 'recipe';
  if (slug === 'garden') return 'garden';
  return 'design';
}

/** Unified offering field model (UI contract for future types). */
export type UnifiedOfferingFields = {
  id?: string;
  ownerId?: string;
  title: string;
  description?: string;
  media?: unknown[];
  type: UnifiedOfferingType;
  category?: string;
  price?: number;
  reward?: string;
  swapValue?: string;
  availability?: string;
  location?: string;
  visibility: 'private' | 'published';
  status?: string;
};
