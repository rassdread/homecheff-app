import type { DiscoveryTrustBadge } from '../contracts/discovery-read-model';
import { badgeDisplayTier } from '@/lib/gamification/badge-priority';

/** Trust-class badge slugs exposed on discovery trust (Phase 2B-F). */
export const DISCOVERY_TRUST_BADGE_SLUGS = new Set([
  'eerste-afspraak',
  'betrouwbare-verkoper',
  'betrouwbare-bezorger',
  'vaste-klant',
  // Tier-floor badges (display on discovery, not ranking score)
  'eerste-review',
  'eerste-verkoop',
]);

export function isTrustClassBadgeSlug(slug: string): boolean {
  return badgeDisplayTier(slug) === 'TRUST';
}

export function filterTrustBadges(
  badges: DiscoveryTrustBadge[] | undefined | null,
): DiscoveryTrustBadge[] {
  if (!badges?.length) return [];
  return badges.filter((b) => isTrustClassBadgeSlug(b.key));
}

export function filterTrustBadgeSlugs(slugs: string[]): string[] {
  return slugs.filter(isTrustClassBadgeSlug);
}

export function trustBadgesFromSlugs(
  slugs: string[],
  nameBySlug?: Map<string, { name: string; icon: string }>,
): DiscoveryTrustBadge[] {
  return filterTrustBadgeSlugs(slugs).map((key) => {
    const meta = nameBySlug?.get(key);
    return {
      key,
      name: meta?.name ?? key,
      icon: meta?.icon ?? '⭐',
    };
  });
}
