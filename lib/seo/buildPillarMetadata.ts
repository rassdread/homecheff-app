import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { getPillarByPath } from '@/lib/seo/pillar-pages';
import { getPillarSeoMeta } from '@/lib/i18n/translations';

async function resolveLang(): Promise<'nl' | 'en'> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');
  if (languageHeader === 'nl' || languageHeader === 'en') return languageHeader;
  if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    return languageCookie.value as 'nl' | 'en';
  }
  return 'nl';
}

export async function buildPillarLandingMetadata(path: string): Promise<Metadata> {
  const pillar = getPillarByPath(path);
  if (!pillar) {
    return { title: 'HomeCheff', robots: { index: false } };
  }
  const lang = await resolveLang();
  const { title, description } = getPillarSeoMeta(pillar.namespace, lang);
  const canonical = `${MAIN_DOMAIN}${path}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      siteName: 'HomeCheff',
    },
    alternates: {
      canonical,
      languages: seoHreflangLanguagesOnEu(path),
    },
    robots: { index: true, follow: true },
  };
}
