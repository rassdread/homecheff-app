/**
 * Utility functions for handling locale (language) routing.
 * Om een nieuwe taal toe te voegen: voeg toe aan SUPPORTED_LOCALES, maak een nieuwe JSON in public/i18n (bijv. de.json)
 * en zorg dat middleware/useTranslation de nieuwe code ondersteunt.
 */
export type Language = 'nl' | 'en';

/** Ondersteunde talen. Uitbreiden = nieuwe entry + i18n JSON + taal-selector. */
export const SUPPORTED_LOCALES: readonly Language[] = ['nl', 'en'];

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
 * @param path - The path to add locale to (e.g., '/inspiratie')
 * @param language - The target language
 * @returns The path with locale prefix (e.g., '/en/inspiratie' for English)
 */
export function addLocalePrefix(path: string, language: Language): string {
  if (language === 'nl') {
    // Remove /en/ prefix if present
    return path.replace(/^\/en/, '') || '/inspiratie';
  } else {
    // Add /en/ prefix
    if (path.startsWith('/en/')) {
      return path; // Already has prefix
    }
    if (path === '/') {
      return '/en/inspiratie';
    }
    return `/en${path}`;
  }
}

/**
 * Remove locale prefix from a path
 * @param path - The path with locale prefix (e.g., '/en/inspiratie')
 * @returns The path without locale prefix (e.g., '/inspiratie')
 */
export function removeLocalePrefix(path: string): string {
  return path.replace(/^\/en/, '') || '/inspiratie';
}






















