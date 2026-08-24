/**
 * SEO 1 — metadata for parent-domain ecosystem / studio / growth landings.
 */

import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { canonicalLogoUrl } from '@/lib/brand/canonical-logo';
import {
  ECOSYSTEM_PARTICIPATION_SOURCES,
} from '@/lib/i18n/ecosystemParticipationSources';
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

export async function resolvePublicLandingLang(): Promise<'nl' | 'en'> {
  return resolveLang();
}

export function tBi(src: Bi, lang: 'nl' | 'en'): string {
  return src[lang];
}

export async function buildEcosystemParticipationMetadata(
  path: string,
  namespace: keyof typeof ECOSYSTEM_PARTICIPATION_SOURCES,
): Promise<Metadata> {
  const lang = await resolveLang();
  const src = ECOSYSTEM_PARTICIPATION_SOURCES[namespace];
  const title = src.metaTitle[lang];
  const description = src.metaDescription[lang];
  const canonical = `${MAIN_DOMAIN}${path}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: 'HomeCheff',
      images: [
        {
          url: canonicalLogoUrl('ogBrand'),
          width: 1200,
          height: 630,
          alt: 'HomeCheff',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical,
      languages: seoHreflangLanguagesOnEu(path),
    },
    robots: { index: true, follow: true },
  };
}
