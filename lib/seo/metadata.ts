import { headers, cookies } from 'next/headers';

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

export async function getCurrentDomain(): Promise<string> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isEnglishDomain = hostname.includes('homecheff.eu');
  return isEnglishDomain ? 'https://homecheff.eu' : 'https://homecheff.nl';
}
