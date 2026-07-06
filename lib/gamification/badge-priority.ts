/**
 * Trust Stabilization Phase 0 — badge display order on profiles and feed.
 * TRUST → ACHIEVEMENT → COMMUNITY (no schema changes).
 */
import type { AuthorBadgeChip } from './author-badge-summaries';

export type BadgeDisplayTier = 'TRUST' | 'ACHIEVEMENT' | 'COMMUNITY';

const TRUST_SLUGS = new Set([
  'eerste-review',
  'eerste-verkoop',
  'eerste-afspraak',
  'betrouwbare-verkoper',
  'betrouwbare-bezorger',
  'vaste-klant',
]);

const ACHIEVEMENT_SLUGS = new Set([
  'welkom-homecheff',
  'eerste-product',
  'fotokoning',
  'streak-starter',
  'hcp-100',
  'early-homecheff',
  'beta-tester',
]);

const TIER_ORDER: Record<BadgeDisplayTier, number> = {
  TRUST: 0,
  ACHIEVEMENT: 1,
  COMMUNITY: 2,
};

export function badgeDisplayTier(slug: string): BadgeDisplayTier {
  const s = slug.trim().toLowerCase();
  if (TRUST_SLUGS.has(s)) return 'TRUST';
  if (ACHIEVEMENT_SLUGS.has(s)) return 'ACHIEVEMENT';
  return 'COMMUNITY';
}

export function sortBadgesByDisplayPriority(
  badges: AuthorBadgeChip[],
  max?: number,
): AuthorBadgeChip[] {
  const sorted = [...badges].sort((a, b) => {
    const ta = TIER_ORDER[badgeDisplayTier(a.key)];
    const tb = TIER_ORDER[badgeDisplayTier(b.key)];
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name, 'nl');
  });
  return max != null ? sorted.slice(0, max) : sorted;
}
