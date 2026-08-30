/**
 * Utility functions for handling locale (language) routing.
 * Om een nieuwe taal toe te voegen: voeg toe aan SUPPORTED_LOCALES, maak een nieuwe JSON in public/i18n (bijv. de.json)
 * en zorg dat middleware/useTranslation de nieuwe code ondersteunt.
 *
 * IP default language: see lib/ecosystem-locale.ts (NL/BE/SR → nl, else en).
 */
import {
  languageFromCountryCode,
  parseEcosystemLanguage,
  resolveEcosystemLanguage,
  type EcosystemLanguage,
} from '@/lib/ecosystem-locale';

export type Language = EcosystemLanguage;

/** Ondersteunde talen. Uitbreiden = nieuwe entry + i18n JSON + taal-selector. */
export const SUPPORTED_LOCALES: readonly Language[] = ['nl', 'en'];

/**
 * Parse Accept-Language → preferred supported language.
 * Kept for soft hints; IP country is the anonymous default (see resolveColdStartLanguage).
 */
export function preferLanguageFromAcceptLanguage(
  header: string | null | undefined,
): Language | null {
  if (!header || typeof header !== 'string') return null;
  const parts = header
    .split(',')
    .map((raw) => {
      const [tagPart, ...params] = raw.trim().split(';');
      const tag = (tagPart || '').trim().toLowerCase();
      let q = 1;
      for (const p of params) {
        const m = p.trim().match(/^q=([0-9.]+)$/i);
        if (m) q = Number(m[1]) || 0;
      }
      return { tag, q };
    })
    .filter((p) => p.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    if (tag === '*' || !tag) continue;
    if (tag === 'nl' || tag.startsWith('nl-')) return 'nl';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
  }
  return null;
}

export type ColdStartLanguageInput = {
  /** Explicit preference (switcher) — wins over everything except caller-supplied account */
  explicitLanguage?: string | null;
  /** True when hc_locale_pref=1 */
  hasExplicitPreference?: boolean;
  /** Account preferredLanguage (middleware usually null) */
  accountLanguage?: string | null;
  /** Cookie / stored choice (hc_locale or homecheff-language) */
  cookieLanguage?: string | null;
  /** Pathname for /en routes */
  pathname?: string | null;
  /** Host header */
  host?: string | null;
  /** Accept-Language — soft hint only when no cookie/IP country */
  acceptLanguage?: string | null;
  /** ISO country from x-vercel-ip-country / cf-ipcountry */
  countryCode?: string | null;
};

/**
 * Cold-start / request language.
 * Priority: explicit → account → cookie → /en path → IP country (NL/BE/SR→nl) → en
 * Accept-Language is only used when country is unknown and no cookie exists (soft hint),
 * then still falls through to IP/en — we do NOT prefer Accept-Language over IP when country is known.
 */
export function resolveColdStartLanguage(input: ColdStartLanguageInput): Language {
  const pathname = input.pathname || '';
  const pathLanguage =
    pathname.startsWith('/en/') || pathname === '/en' ? 'en' : null;

  const host = (input.host || '').toLowerCase();
  // Legacy .nl host → treat as NL market when nothing else is set
  const hostCountryHint = host.includes('homecheff.nl') ? 'NL' : null;

  const explicit =
    input.hasExplicitPreference || input.explicitLanguage
      ? parseEcosystemLanguage(input.explicitLanguage ?? input.cookieLanguage)
      : null;

  const resolved = resolveEcosystemLanguage({
    explicitLanguage: explicit,
    accountLanguage: input.accountLanguage,
    cookieLanguage: input.cookieLanguage,
    pathLanguage,
    countryCode: input.countryCode ?? hostCountryHint,
  });

  // Soft Accept-Language only when country unknown and resolver returned en from empty country
  if (
    !input.cookieLanguage &&
    !explicit &&
    !input.accountLanguage &&
    !pathLanguage &&
    !normalizeOrNull(input.countryCode) &&
    !hostCountryHint
  ) {
    const fromHeader = preferLanguageFromAcceptLanguage(input.acceptLanguage);
    if (fromHeader) return fromHeader;
  }

  return resolved;
}

function normalizeOrNull(c: string | null | undefined): string | null {
  if (!c) return null;
  const t = c.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(t) ? t : null;
}

export { languageFromCountryCode };

/**
 * Get the current language from the pathname
 */
export function getLanguageFromPath(pathname: string): Language {
  if (pathname.startsWith('/en/') || pathname === '/en') {
    return 'en';
  }
  return 'nl';
}

/**
 * Add locale prefix to a path
 */
export function addLocalePrefix(path: string, language: Language): string {
  if (language === 'nl') {
    return path.replace(/^\/en/, '') || '/';
  } else {
    if (path.startsWith('/en/')) {
      return path;
    }
    if (path === '/') {
      return '/';
    }
    return `/en${path}`;
  }
}

/**
 * Remove locale prefix from a path
 */
export function removeLocalePrefix(path: string): string {
  return path.replace(/^\/en/, '') || '/';
}
