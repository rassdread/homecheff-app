import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';
import { getFounderOriginByPath } from '@/lib/seo/founder-origin-pages';
import { getFounderOriginSeoMeta } from '@/lib/i18n/translations';

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

export async function buildFounderOriginMetadata(
  path: string,
  forceLang?: 'nl' | 'en',
): Promise<Metadata> {
  const page = getFounderOriginByPath(path);
  if (!page) {
    return { title: 'HomeCheff', robots: { index: false } };
  }
  const lang = forceLang ?? (await resolveLang());
  const { title, description } = getFounderOriginSeoMeta(page.namespace, lang);
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
      images: [
        {
          url: `${MAIN_DOMAIN}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: 'HomeCheff — Digital neighbourhood marketplace',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${MAIN_DOMAIN}/opengraph-image`],
    },
    alternates: {
      canonical,
      languages: {
        'nl-NL': canonical,
        'en-US': canonical,
        'x-default': `${MAIN_DOMAIN}/`,
      },
    },
    robots: { index: true, follow: true },
  };
}
