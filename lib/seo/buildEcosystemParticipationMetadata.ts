/**
 * SEO 1 — metadata for parent-domain ecosystem / studio / growth landings.
 */

import type { Metadata } from 'next';
import { MAIN_DOMAIN, getCurrentLanguage, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { canonicalLogoUrl } from '@/lib/brand/canonical-logo';
import {
  ECOSYSTEM_PARTICIPATION_SOURCES,
} from '@/lib/i18n/ecosystemParticipationSources';
import type { Bi } from '@/lib/i18n/seoLandingSources';

async function resolveLang(): Promise<'nl' | 'en'> {
  return getCurrentLanguage();
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
