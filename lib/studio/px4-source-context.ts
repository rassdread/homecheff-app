/**
 * PX.4 — client-safe listing → Studio deep link helpers.
 * Keep Node crypto out of this file: ProductSalePrimaryActions is a client component.
 */
export const PX4_STUDIO_SOURCE = 'homecheff' as const;
export const PX4_STUDIO_SOURCE_TYPE_PRODUCT = 'product' as const;
export const PX4_MEDIA_CAP = 8;
export const PX4_TITLE_MAX = 200;
export const PX4_DESCRIPTION_MAX = 1500;
export const PX4_CONTEXT_MAX_SKEW_SEC = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPx4OpaqueId(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function isPx4ProductSourceType(value: string): boolean {
  return value.trim().toLowerCase() === PX4_STUDIO_SOURCE_TYPE_PRODUCT;
}

export function studioPx4CanonicalPath(productId: string): string {
  return `/studio/from/homecheff/product/${productId}`;
}

export function studioOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_STUDIO_URL?.trim() ||
    process.env.STUDIO_PUBLIC_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'https://studio.homecheff.eu';
}

export function buildStudioListingCreateHref(productId: string): string {
  if (!isPx4OpaqueId(productId)) return studioOrigin();
  return `${studioOrigin()}${studioPx4CanonicalPath(productId)}`;
}

export function shouldShowStudioCreateCta(isOwner: boolean): boolean {
  return isOwner === true;
}

export function clampText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd();
}

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeListingMediaUrls(urls: string[], cap = PX4_MEDIA_CAP): { url: string }[] {
  const out: { url: string }[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    if (out.length >= cap) break;
    const url = raw.trim();
    if (!url || seen.has(url) || !isHttpsUrl(url)) continue;
    seen.add(url);
    out.push({ url });
  }
  return out;
}

export function sellerDisplayNameFromUser(user: {
  name?: string | null;
  username?: string | null;
  displayFullName?: boolean | null;
} | null): string | null {
  if (!user) return null;
  const full = user.displayFullName !== false;
  const primary = full ? user.name || user.username : user.username || user.name;
  const value = (primary ?? '').trim();
  return value ? clampText(value, 80) : null;
}

export function homecheffProductReturnTarget(productId: string): string {
  const origin = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://homecheff.eu')
    .trim()
    .replace(/\/$/, '');
  return `${origin}/product/${productId}`;
}

export function authorizeOwnerProductProjection(
  row: {
    sellerUserId: string | null;
    integrityStatus?: string | null;
  } | null,
  centralUserId: string,
): { ok: true } | { ok: false; reason: 'not_found' } {
  if (!row || !centralUserId.trim()) return { ok: false, reason: 'not_found' };
  if (row.sellerUserId !== centralUserId) return { ok: false, reason: 'not_found' };
  if ((row.integrityStatus ?? 'ACTIVE') === 'REMOVED') {
    return { ok: false, reason: 'not_found' };
  }
  return { ok: true };
}

export type StudioListingProjection = {
  source: typeof PX4_STUDIO_SOURCE;
  sourceType: typeof PX4_STUDIO_SOURCE_TYPE_PRODUCT;
  sourceId: string;
  title: string;
  description: string;
  media: { url: string }[];
  category: string | null;
  sellerDisplayName: string | null;
  returnTarget: string;
};

export function toStudioListingProjection(input: {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  marketplaceCategory?: string | null;
  imageUrls: string[];
  sellerDisplayName: string | null;
}): StudioListingProjection {
  return {
    source: PX4_STUDIO_SOURCE,
    sourceType: PX4_STUDIO_SOURCE_TYPE_PRODUCT,
    sourceId: input.id,
    title: clampText(input.title, PX4_TITLE_MAX),
    description: clampText(input.description, PX4_DESCRIPTION_MAX),
    media: normalizeListingMediaUrls(input.imageUrls),
    category: input.marketplaceCategory || input.category || null,
    sellerDisplayName: input.sellerDisplayName,
    returnTarget: homecheffProductReturnTarget(input.id),
  };
}

export const PX4_EXCLUDED_LISTING_FIELDS = [
  'priceCents',
  'pickupLat',
  'pickupLng',
  'kvk',
  'stripeConnectAccountId',
  'allergens',
  'integrityHiddenReason',
  'iban',
  'email',
] as const;
