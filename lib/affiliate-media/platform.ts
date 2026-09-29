import { canonicalPromoUrl } from '@/lib/affiliate-media/share-url';
import { appendPersonalRef } from '@/lib/share/resolve-marketplace-share-url';

/** One library. Platform is what the asset promotes, not a separate library. */
export const PROMO_PLATFORMS = ['ECOSYSTEM', 'MARKETPLACE', 'GROWTH', 'STUDIO', 'DELIVERY'] as const;

export type PromoPlatform = (typeof PROMO_PLATFORMS)[number];

const PLATFORM_SET = new Set<string>(PROMO_PLATFORMS);

export function parsePromoPlatform(raw: string | null | undefined): PromoPlatform | null {
  const value = (raw ?? '').trim().toUpperCase();
  if (value === 'BEZORGING') return 'DELIVERY';
  if (value === 'ALGEMEEN' || value === 'HOMECHEFF' || value === 'GENERAL') return 'ECOSYSTEM';
  if (PLATFORM_SET.has(value)) return value as PromoPlatform;
  return null;
}

export function inferPromoPlatform(input: {
  campaignTag?: string | null;
  destinationPath?: string | null;
}): PromoPlatform {
  const tagged = parsePromoPlatform(input.campaignTag);
  if (tagged) return tagged;
  const path = (input.destinationPath || '/').replace(/\/+$/, '') || '/';
  if (path === '/onboarding/seller') return 'MARKETPLACE';
  if (path === '/delivery/signup' || path === '/delivery/company/signup') return 'DELIVERY';
  return 'ECOSYSTEM';
}

/** Internal landing path stored on the asset. Growth and Studio leave the site at share time. */
export function destinationForPlatform(platform: PromoPlatform): string {
  if (platform === 'MARKETPLACE') return '/onboarding/seller';
  if (platform === 'DELIVERY') return '/delivery/signup';
  return '/';
}

/**
 * URL that receives the current viewer's attribution at share time.
 * The asset row never stores that referral code.
 */
export function promoShareAbsolute(input: {
  platform: PromoPlatform;
  shareSlug: string;
  origin?: string;
}): string {
  if (input.platform === 'GROWTH') return 'https://growth.homecheff.eu/';
  if (input.platform === 'STUDIO') return 'https://studio.homecheff.eu/signup';
  return canonicalPromoUrl(input.shareSlug, input.origin);
}

/** Onward link from a shared asset. The referral belongs to whoever shared it. */
export function promoContinueHref(input: {
  campaignTag?: string | null;
  destinationPath?: string | null;
  sharingReferralCode?: string | null;
}): string {
  const platform = inferPromoPlatform(input);
  if (platform === 'GROWTH' || platform === 'STUDIO') {
    const base = platform === 'GROWTH' ? 'https://growth.homecheff.eu/' : 'https://studio.homecheff.eu/signup';
    return appendPersonalRef(base, input.sharingReferralCode || null);
  }
  const path = (input.destinationPath || '/').startsWith('/') ? input.destinationPath || '/' : '/';
  return path;
}

export function promoLibraryPath(input: {
  platform?: PromoPlatform | null;
  source?: 'all' | 'official' | 'community' | 'mine' | null;
}): string {
  const params = new URLSearchParams();
  if (input.platform) params.set('platform', input.platform.toLowerCase());
  if (input.source && input.source !== 'all') params.set('source', input.source);
  const query = params.toString();
  return query ? `/affiliate/promotiemateriaal?${query}` : '/affiliate/promotiemateriaal';
}
