import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { COMPARISON_PAGE_SOURCES } from '@/lib/i18n/comparisonPageSources';
import { ECOSYSTEM_MAP_SOURCES } from '@/lib/i18n/ecosystemMapSources';
import { MANIFEST_PAGE_SOURCES } from '@/lib/i18n/manifestPageSources';
import { OPEN_KNOWLEDGE_SOURCES } from '@/lib/i18n/openKnowledgeSources';
import { OPERATING_SYSTEM_PAGE_SOURCES } from '@/lib/i18n/operatingSystemSources';
import type { Bi } from '@/lib/i18n/seoLandingSources';

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

function metaFromSource(src: Record<string, Bi>, lang: 'nl' | 'en') {
  return {
    title: src.metaTitle[lang],
    description: src.metaDescription[lang],
  };
}

export async function buildAuthorityPageMetadata(
  path: string,
  namespace: string,
): Promise<Metadata> {
  const lang = await resolveLang();
  const src =
    COMPARISON_PAGE_SOURCES[namespace] ??
    ECOSYSTEM_MAP_SOURCES[namespace] ??
    MANIFEST_PAGE_SOURCES[namespace] ??
    OPEN_KNOWLEDGE_SOURCES[namespace] ??
    OPERATING_SYSTEM_PAGE_SOURCES[namespace] ??
    null;
  if (!src?.metaTitle || !src?.metaDescription) {
    return { title: 'HomeCheff', robots: { index: false } };
  }
  const { title, description } = metaFromSource(src, lang);
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
