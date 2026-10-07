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

export type PillarLandingMetadataOptions = {
  /** When set, this route does not follow the language cookie. */
  lang?: 'nl' | 'en';
  /** Public path used as the canonical URL. Defaults to `path`. */
  canonicalPath?: string;
  /** Dedicated English path. Pairs hreflang with the Dutch `path`. */
  alternateEnPath?: string;
};

export function pillarRouteAlternates(
  path: string,
  options?: Pick<PillarLandingMetadataOptions, 'canonicalPath' | 'alternateEnPath'>,
): { canonical: string; languages: Record<string, string> } {
  const canonicalPath = options?.canonicalPath ?? path;
  const canonical = `${MAIN_DOMAIN}${canonicalPath}`;
  if (!options?.alternateEnPath) {
    return { canonical, languages: seoHreflangLanguagesOnEu(canonicalPath) };
  }
  return {
    canonical,
    languages: {
      'nl-NL': `${MAIN_DOMAIN}${path}`,
      'en-US': `${MAIN_DOMAIN}${options.alternateEnPath}`,
      'x-default': `${MAIN_DOMAIN}/`,
    },
  };
}

export async function buildPillarLandingMetadata(
  path: string,
  options?: PillarLandingMetadataOptions,
): Promise<Metadata> {
  const pillar = getPillarByPath(path);
  if (!pillar) {
    return { title: 'HomeCheff', robots: { index: false } };
  }
  const lang = options?.lang ?? (await resolveLang());
  const { title, description } = getPillarSeoMeta(pillar.namespace, lang);
  const { canonical, languages } = pillarRouteAlternates(path, options);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      siteName: 'HomeCheff',
      locale: lang === 'en' ? 'en_US' : 'nl_NL',
    },
    alternates: {
      canonical,
      languages,
    },
    robots: { index: true, follow: true },
  };
}
