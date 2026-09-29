/**
 * Canonical affiliate destinations. The visible hierarchy is the URL.
 * Old paths and query aliases redirect here; they are not the navigation state.
 */

export const AFFILIATE_PLACES = [
  'overzicht',
  'promoten',
  'marketplace',
  'growth',
  'studio',
  'bezorging',
  'verdiensten',
  'netwerk',
  'aanmeldingen',
] as const;

export type AffiliatePlace = (typeof AFFILIATE_PLACES)[number];

/** @deprecated Use AffiliatePlace. Kept so older imports still typecheck during the move. */
export type AffiliateSection = AffiliatePlace;

export const GROWTH_DEMOS_HREF =
  'https://growth.homecheff.eu/auth/sso/silent?mode=ecosystem&returnTo=%2Faccount%2Fgrowth-affiliate%2Fdemos';

const HREFS: Record<AffiliatePlace, string> = {
  overzicht: '/affiliate/dashboard',
  promoten: '/affiliate/dashboard/promoten',
  marketplace: '/affiliate/dashboard/promoten/marketplace',
  growth: '/affiliate/dashboard/promoten/growth',
  studio: '/affiliate/dashboard/promoten/studio',
  bezorging: '/affiliate/dashboard/promoten/bezorging',
  verdiensten: '/affiliate/dashboard/verdiensten',
  netwerk: '/affiliate/dashboard/netwerk',
  aanmeldingen: '/affiliate/dashboard/netwerk/aanmeldingen',
};

export function affiliatePlaceHref(place: AffiliatePlace): string {
  return HREFS[place];
}

/** Same map as affiliatePlaceHref. Old section names now point at the new paths. */
export function affiliateSectionHref(place: AffiliatePlace): string {
  return affiliatePlaceHref(place);
}

const LEGACY_SINGLE_SEGMENT: Record<string, string> = {
  verdienen: HREFS.promoten,
  earn: HREFS.promoten,
  marketplace: HREFS.marketplace,
  growth: HREFS.growth,
  studio: HREFS.studio,
  bezorging: HREFS.bezorging,
  delivery: HREFS.bezorging,
  aanmeldingen: HREFS.aanmeldingen,
  referrals: HREFS.aanmeldingen,
  overzicht: HREFS.overzicht,
  overview: HREFS.overzicht,
};

export function legacyAffiliateSegmentRedirect(segment: string): string | null {
  const value = segment.trim().toLowerCase();
  return LEGACY_SINGLE_SEGMENT[value] ?? null;
}

export function canonicalHrefForLegacyToken(raw: string | null | undefined): string {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value || value === 'overview' || value === 'overzicht') return HREFS.overzicht;
  if (value === 'earnings' || value === 'verdiensten') return HREFS.verdiensten;
  if (value === 'earn' || value === 'verdienen') return HREFS.promoten;
  if (value === 'referrals' || value === 'aanmeldingen') return HREFS.aanmeldingen;
  if (value === 'promoten' || value === 'promote') return HREFS.promoten;
  if (value === 'netwerk' || value === 'network') return HREFS.netwerk;
  if (value === 'marketplace') return HREFS.marketplace;
  if (value === 'growth') return HREFS.growth;
  if (value === 'studio') return HREFS.studio;
  if (value === 'bezorging' || value === 'delivery') return HREFS.bezorging;
  if ((AFFILIATE_PLACES as readonly string[]).includes(value)) return HREFS[value as AffiliatePlace];
  return HREFS.overzicht;
}

/** @deprecated Query aliases now resolve to a canonical path via canonicalHrefForLegacyToken. */
export function resolveAffiliateSection(raw: string | null | undefined): AffiliatePlace {
  const href = canonicalHrefForLegacyToken(raw);
  const found = (Object.keys(HREFS) as AffiliatePlace[]).find((place) => HREFS[place] === href);
  return found ?? 'overzicht';
}

export function affiliatePlaceFromPathname(pathname: string | null | undefined): AffiliatePlace | null {
  const path = (pathname ?? '').replace(/\/+$/, '') || '/';
  if (path === '/affiliate/dashboard') return 'overzicht';
  if (path === '/affiliate/dashboard/promoten') return 'promoten';
  if (path === '/affiliate/dashboard/promoten/marketplace') return 'marketplace';
  if (path === '/affiliate/dashboard/promoten/growth') return 'growth';
  if (path === '/affiliate/dashboard/promoten/studio') return 'studio';
  if (path === '/affiliate/dashboard/promoten/bezorging') return 'bezorging';
  if (path === '/affiliate/dashboard/verdiensten') return 'verdiensten';
  if (path === '/affiliate/dashboard/netwerk') return 'netwerk';
  if (path === '/affiliate/dashboard/netwerk/aanmeldingen') return 'aanmeldingen';
  return null;
}

export function affiliateSectionFromPathname(pathname: string | null | undefined): AffiliatePlace | null {
  return affiliatePlaceFromPathname(pathname);
}

export function isPromotePlace(place: AffiliatePlace | null): boolean {
  return place === 'promoten' || place === 'marketplace' || place === 'growth' || place === 'studio' || place === 'bezorging';
}

export function isNetworkPlace(place: AffiliatePlace | null): boolean {
  return place === 'netwerk' || place === 'aanmeldingen';
}
