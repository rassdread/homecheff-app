import { MAIN_DOMAIN } from '@/lib/seo/constants';
import { appendPersonalRef } from '@/lib/share/resolve-marketplace-share-url';

const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function newAffiliateMediaShareSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let out = '';
  for (const b of bytes) out += SLUG_ALPHABET[b % SLUG_ALPHABET.length];
  return out;
}

export function isValidShareSlug(slug: string): boolean {
  return /^[a-z0-9]{8,16}$/.test(slug);
}

export function canonicalPromoPath(shareSlug: string): string {
  return `/p/${shareSlug}`;
}

export function canonicalPromoUrl(shareSlug: string, origin = MAIN_DOMAIN): string {
  return `${origin.replace(/\/$/, '')}${canonicalPromoPath(shareSlug)}`;
}

/**
 * Attribution belongs to the SHARING affiliate, never the creator.
 * Asset identity is the slug; ref is applied at share time.
 */
export function attributedPromoUrl(input: {
  shareSlug: string;
  sharingReferralCode: string | null | undefined;
  origin?: string;
}): string {
  const clean = canonicalPromoUrl(input.shareSlug, input.origin);
  return appendPersonalRef(clean, input.sharingReferralCode || null, input.origin);
}
