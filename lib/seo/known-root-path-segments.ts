/**
 * LEGAL-0 — Known first-path segments that are real app/SEO routes.
 *
 * app/[seoSlug] is a catch-all for NL SEO landings from the SEO page defs.
 * Unknown first segments must not render that page as HTTP 200 with
 * homepage metadata.
 *
 * Keep APP_FIRST_SEGMENTS in sync with app first-level folders.
 * scripts/validate-legal-0-integrity.ts asserts filesystem drift.
 */

import { ETEN_VERKOPEN_CITY_SLUGS } from '@/lib/seo/etenVerkopenCities';
import { HOMECHEFF_SEO_PAGE_DEFS } from '@/lib/seo/homecheffSeoPages.data';

const ETEN_VERKOPEN_PREFIX = 'eten-verkopen-';

/** Static `app/en/*` folders (not the `[seoSlug]` catch-all). */
export const EN_APP_FIRST_SEGMENTS = ['seo-hub', 'welkom', 'what-is-homecheff'] as const;

const NL_SEO_SLUGS = HOMECHEFF_SEO_PAGE_DEFS.map((p) => p.nlSlug);
const EN_SEO_SLUGS = HOMECHEFF_SEO_PAGE_DEFS.map((p) => p.enSlug);

/**
 * First URL segment of every `app/<segment>` route except `[seoSlug]`
 * and `eten-verkopen-[stad]` (handled via city prefix).
 */
export const APP_FIRST_SEGMENTS = [
  '.well-known',
  'admin',
  'affiliate',
  'agreements',
  'ai',
  'ai.txt',
  'alternatief-voor-dropshipping',
  'app',
  'arriassisme',
  'auth',
  'aviliate',
  'aw-settings-harness',
  'bezorger',
  'bezorger-worden',
  'bijverdienen-vanuit-huis',
  'buurt-economie',
  'buurthulp',
  'changelog',
  'checkout',
  'community-guidelines',
  'constitution',
  'contact',
  'deal-review',
  'delete-account',
  'delivery',
  'delivery-review',
  'design',
  'docs',
  'dorpsplein',
  'en',
  'eten-verkopen-vanuit-huis',
  'evidence',
  'faq',
  'favorites',
  'forgot-password',
  'garden',
  'geld-verdienen-met-koken',
  'gemeenschap',
  'glossary',
  'hc-http-404',
  'hcp-ranglijsten',
  'hoe-homecheff-werkt',
  'how-homecheff-grows',
  'inspiratie',
  'listing',
  'llms-full.txt',
  'llms.txt',
  'login',
  'lokaal-eten-verkopen',
  'lokaal-verdienen',
  'lokale-producten-verkopen',
  'maaltijden',
  'manifest',
  'messages',
  'mijn-hcp',
  'notifications',
  'onboarding',
  'ontmoet-de-maker',
  'oorsprong-homecheff',
  'operations',
  'orders',
  'over-ons',
  'payment',
  'persoonlijk-vakmanschap',
  'pitch',
  'place',
  'pricing',
  'principles',
  'privacy',
  'product',
  'profile',
  'r',
  'recipe',
  'register',
  'reports',
  'request',
  'reservations',
  'reset-password',
  'review',
  'roadmap',
  'safety',
  'sell',
  'seller',
  'seo-hub',
  'sergio-arrias',
  'settings',
  'sitemap.xml',
  'sms',
  'social-login-success',
  'statistics',
  'stories',
  'success',
  'terms',
  'thuisgekookt-eten-verkopen',
  'timeline',
  'trust',
  'uitnodiging',
  'unieke-producten-verkopen',
  'user',
  'verdienen-zonder-dropshipping',
  'verdiensten',
  'vergelijken',
  'verificatie',
  'verify-email',
  'verkoper',
  'waarom-homecheff',
  'wat-is-homecheff',
  'wat-we-niet-zijn',
  'welkom',
  'werken-bij',
  'zelfgemaakt-eten-verkopen',
] as const;

const APP_FIRST_SEGMENT_SET = new Set<string>(APP_FIRST_SEGMENTS);
const EN_APP_FIRST_SEGMENT_SET = new Set<string>([...EN_APP_FIRST_SEGMENTS]);

const ROOT_FILE_SEGMENTS = new Set([
  'favicon.ico',
  'icon.png',
  'apple-icon.png',
  'apple-touch-icon.png',
  'manifest.json',
  'robots.txt',
  'opengraph-image',
  'twitter-image',
]);

/** Root /brand/* and single-segment public static files (PNG/ICO/etc.). */
const ROOT_STATIC_ASSET_RE =
  /\.(?:png|jpe?g|webp|gif|ico|svg|woff2?|ttf|map)$/i;

/**
 * True for deployable `public/` brand and chrome assets that must never be
 * rewritten to `/hc-http-404` (LEGAL-0 unknown-slug guard).
 *
 * SP.2C.2a: `/logo.png`, `/homecheff-globeman.png`, `/og-brand.png`,
 * `/avatar-placeholder.png`, `/brand/*` were 404 despite existing on disk.
 */
export function isPublicStaticAssetPath(pathname: string): boolean {
  const parts = firstPathSegments(pathname);
  if (parts.length === 0) return false;
  if (parts[0] === 'brand') return true;
  if (parts.length === 1 && ROOT_STATIC_ASSET_RE.test(parts[0])) return true;
  return false;
}

function firstPathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

function isEtenVerkopenCitySegment(segment: string): boolean {
  if (!segment.startsWith(ETEN_VERKOPEN_PREFIX)) return false;
  const city = segment.slice(ETEN_VERKOPEN_PREFIX.length);
  return (ETEN_VERKOPEN_CITY_SLUGS as readonly string[]).includes(city);
}

/**
 * True when this pathname is a real HomeCheff route (app folder, SEO slug,
 * or city landing). False means it would only match `app/[seoSlug]` as an
 * unknown slug and must 404.
 */
export function isKnownHomecheffRootPath(pathname: string): boolean {
  const parts = firstPathSegments(pathname);
  if (parts.length === 0) return true;

  const first = parts[0];
  if (ROOT_FILE_SEGMENTS.has(first)) return true;
  if (isPublicStaticAssetPath(pathname)) return true;
  if (first === 'api' || first === 'i18n') return true;
  if (APP_FIRST_SEGMENT_SET.has(first)) {
    if (first === 'en') {
      const second = parts[1];
      if (!second) return true;
      if (EN_APP_FIRST_SEGMENT_SET.has(second)) return true;
      if (EN_SEO_SLUGS.includes(second)) return true;
      return false;
    }
    return true;
  }
  if (isEtenVerkopenCitySegment(first)) return true;
  if (NL_SEO_SLUGS.includes(first)) return true;
  return false;
}
