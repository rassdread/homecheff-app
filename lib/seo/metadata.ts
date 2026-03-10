import { headers, cookies } from 'next/headers';

/** Hoofddomein: altijd .eu. .nl is de Nederlandse variant van de .eu-site. */
export const MAIN_DOMAIN = 'https://homecheff.eu';
export const NL_DOMAIN = 'https://homecheff.nl';

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
