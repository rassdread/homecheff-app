/**
 * Hero visitor place. Explicit and saved discovery locations win.
 * IP city is never a hero city: a country-only or approximate lookup
 * must not be presented as "bij jou in {stad}".
 */

export type HeroGeoSaved = {
  source?: string | null;
  place?: string | null;
  label?: string | null;
};

export type HeroGeoInput = {
  /** URL ?place= or another explicit discovery choice. */
  explicitPlace?: string | null;
  saved?: HeroGeoSaved | null;
  /** Account / profile place. Used only when nothing explicit or saved wins. */
  accountPlace?: string | null;
  /** ISO country from the existing IP approx. Origin copy only, never a city. */
  countryCode?: string | null;
};

export type HeroGeoSource = 'explicit' | 'saved' | 'account' | 'generic';

export type HeroGeoContext = {
  city: string | null;
  source: HeroGeoSource;
  /** Secondary origin line. Never a substitute for the visitor's city. */
  showOriginNote: boolean;
};

const RELIABLE_SAVED = new Set(['manual', 'gps', 'profile']);

function cleanPlace(raw: string | null | undefined): string | null {
  const value = raw?.replace(/\s+/g, ' ').trim().slice(0, 80) ?? '';
  if (!value) return null;
  if (/^[A-Za-z]{2}$/.test(value)) return null;
  return value;
}

export function isVlaardingenPlace(city: string | null | undefined): boolean {
  const value = city?.trim().toLowerCase() ?? '';
  return value === 'vlaardingen' || value.startsWith('vlaardingen,') || value.startsWith('vlaardingen ');
}

export function resolveHeroGeoContext(input: HeroGeoInput): HeroGeoContext {
  const explicit = cleanPlace(input.explicitPlace);
  if (explicit) {
    return { city: explicit, source: 'explicit', showOriginNote: false };
  }

  const savedSource = input.saved?.source ?? '';
  if (RELIABLE_SAVED.has(savedSource)) {
    const saved = cleanPlace(input.saved?.place) || cleanPlace(input.saved?.label);
    if (saved) {
      return { city: saved, source: 'saved', showOriginNote: false };
    }
  }

  const account = cleanPlace(input.accountPlace);
  if (account) {
    return { city: account, source: 'account', showOriginNote: false };
  }

  const country = input.countryCode?.trim().toUpperCase() ?? '';
  return {
    city: null,
    source: 'generic',
    showOriginNote: country === 'NL',
  };
}
