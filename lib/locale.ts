/**
 * Utility functions for handling locale (language) routing.
 * Om een nieuwe taal toe te voegen: voeg toe aan SUPPORTED_LOCALES, maak een nieuwe JSON in public/i18n (bijv. de.json)
 * en zorg dat middleware/useTranslation de nieuwe code ondersteunt.
 */
export type Language = 'nl' | 'en';

/** Ondersteunde talen. Uitbreiden = nieuwe entry + i18n JSON + taal-selector. */
export const SUPPORTED_LOCALES: readonly Language[] = ['nl', 'en'];

/**
 * Parse Accept-Language → preferred supported language.
 * nl* → nl, en* → en. Unknown / empty → null (caller chooses fallback).
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
  /** Explicit cookie / stored choice */
  cookieLanguage?: string | null;
  /** Pathname for /en routes */
  pathname?: string | null;
  /** Host header */
  host?: string | null;
  /** Accept-Language header */
  acceptLanguage?: string | null;
};

/**
 * Cold-start language for first-time visitors (no stored preference).
 * Priority: cookie → /en path → Accept-Language → .nl host → NL fallback.
 * .eu must NOT force English — Dutch product market + NL browser → NL UI.
 */
export function resolveColdStartLanguage(input: ColdStartLanguageInput): Language {
  const cookie = input.cookieLanguage;
  if (cookie === 'nl' || cookie === 'en') return cookie;

  const pathname = input.pathname || '';
  if (pathname.startsWith('/en/') || pathname === '/en') return 'en';

  const fromHeader = preferLanguageFromAcceptLanguage(input.acceptLanguage);
  if (fromHeader) return fromHeader;

  const host = (input.host || '').toLowerCase();
  if (host.includes('homecheff.nl')) return 'nl';

  // .eu / preview / unknown without Accept-Language → NL (primary market)
  return 'nl';
}

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
 * @param path - The path to add locale to (e.g., '/faq')
 * @param language - The target language
 * @returns The path with locale prefix (e.g., '/en/faq' for English)
 */
export function addLocalePrefix(path: string, language: Language): string {
  if (language === 'nl') {
    // Remove /en/ prefix if present
    return path.replace(/^\/en/, '') || '/';
  } else {
    // Add /en/ prefix
    if (path.startsWith('/en/')) {
      return path; // Already has prefix
    }
    if (path === '/') {
      return '/';
    }
    return `/en${path}`;
  }
}

/**
 * Remove locale prefix from a path
 * @param path - The path with locale prefix (e.g., '/en/faq')
 * @returns The path without locale prefix (e.g., '/faq')
 */
export function removeLocalePrefix(path: string): string {
  return path.replace(/^\/en/, '') || '/';
}






















