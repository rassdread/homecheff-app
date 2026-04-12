import { headers, cookies } from 'next/headers';

/**
 * homecheff.eu = enige canonieke basis voor metadata (canonical, OG, hreflang, sitemap).
 * homecheff.nl = redirect naar .eu; niet gebruiken in canonicals of hreflang.
 * (NL/EN op dezelfde .eu-URL via cookie/header waar van toepassing.)
 */
export const MAIN_DOMAIN = 'https://homecheff.eu';

/** Alleen voor CORS, allowed origins, e-mail — niet voor canonical SEO. */
export const NL_DOMAIN = 'https://homecheff.nl';

/**
 * hreflang voor routes die één URL op .eu delen (taal via cookie/header).
 * nl-NL en en-US wijzen naar dezelfde canonieke URL; x-default = homepage .eu.
 */
export function seoHreflangLanguagesOnEu(path: string): Record<string, string> {
  const normalized =
    path === "" || path === "/"
      ? ""
      : path.startsWith("/")
        ? path
        : `/${path}`;
  const pageUrl = normalized === "" ? MAIN_DOMAIN : `${MAIN_DOMAIN}${normalized}`;
  return {
    "nl-NL": pageUrl,
    "en-US": pageUrl,
    "x-default": `${MAIN_DOMAIN}/`,
  };
}

export async function getCurrentLanguage(): Promise<'nl' | 'en'> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');
  
  if (languageHeader === 'nl' || languageHeader === 'en') {
    return languageHeader;
  }
  if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    return languageCookie.value as 'nl' | 'en';
  }
  return 'nl';
}

/** Geeft altijd het hoofddomein .eu terug (canonical, OG, structured data). */
export async function getCurrentDomain(): Promise<string> {
  return MAIN_DOMAIN;
}

/**
 * Base URL for Next.js metadata (icons, Open Graph images, etc.) so paths resolve
 * on the same host as the request (production, preview, localhost) — avoids broken
 * or cross-origin favicons when MAIN_DOMAIN differs from the active host.
 */
export function getMetadataBaseFromHeaders(headersList: Headers): URL {
  const forwarded = headersList.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwarded || headersList.get('host') || new URL(MAIN_DOMAIN).host;
  const protoHeader = headersList.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const local = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = protoHeader || (local ? 'http' : 'https');
  try {
    return new URL(`${proto}://${host}`);
  } catch {
    return new URL(MAIN_DOMAIN);
  }
}
