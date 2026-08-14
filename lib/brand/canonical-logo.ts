/**
 * Canonical HomeCheff logo SSOT — all public logo consumers should derive from here.
 * Bump CANONICAL_LOGO_VERSION when replacing public logo assets (cache bust).
 */
import { MAIN_DOMAIN } from '@/lib/seo/constants';

/** Query string appended to logo URLs after asset replacement (Safari/CDN cache bust). */
export const CANONICAL_LOGO_VERSION = 'hc8a2';

/** Relative public paths — served from /public or Next app icon routes. */
export const CANONICAL_LOGO_PATHS = {
  /** Approved operator-supplied primary asset (PNG archive copy). */
  primary: '/brand/homecheff-logo-primary.png',
  /** Organization JSON-LD logo — square, ≥112px, white-background safe. */
  organization: '/logo.png',
  /** Default UI/nav square logo (certified Production mark). */
  square: '/icon-192.png',
  /** PWA any-purpose large icon. */
  square512: '/icon-512.png',
  /** PWA/Android maskable derivative (safe-zone padded). */
  maskable512: '/icon-maskable-512.png',
  /** Small notification / email icon. */
  notification: '/icon.png',
  faviconIco: '/favicon.ico',
  favicon48: '/favicon-48.png',
  favicon32: '/favicon-32.png',
  favicon16: '/favicon-16.png',
  appleTouch: '/apple-touch-icon.png',
  /** Homepage hero mascot — same approved artwork, full composition. */
  heroMascot: '/homecheff-globeman.png',
  /** 1200×630 brand card for homepage / authority OG previews. */
  ogBrand: '/og-brand.png',
} as const;

export type CanonicalLogoPathKey = keyof typeof CANONICAL_LOGO_PATHS;

export function canonicalLogoPath(key: CanonicalLogoPathKey): string {
  return CANONICAL_LOGO_PATHS[key];
}

/** Absolute HTTPS URL on canonical domain (.eu). */
export function canonicalLogoUrl(
  key: CanonicalLogoPathKey,
  domain: string = MAIN_DOMAIN,
  withVersion = true,
): string {
  const base = domain.replace(/\/$/, '');
  const path = canonicalLogoPath(key);
  const q = withVersion ? `?v=${CANONICAL_LOGO_VERSION}` : '';
  return `${base}${path}${q}`;
}

/** Root layout favicon / apple-touch query (legacy alias — same version token). */
export const FAVICON_ASSET_Q = `?v=${CANONICAL_LOGO_VERSION}` as const;
export const OG_IMAGE_Q = `?v=${CANONICAL_LOGO_VERSION}` as const;
