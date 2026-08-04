import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';
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

export async function buildPillarLandingMetadata(
  path: string,
  forceLang?: 'nl' | 'en',
): Promise<Metadata> {
  const pillar = getPillarByPath(path);
  if (!pillar) {
    return { title: 'HomeCheff', robots: { index: false } };
  }
  const lang = forceLang ?? (await resolveLang());
  const { title, description } = getPillarSeoMeta(pillar.namespace, lang);
  const nlCanonical = `${MAIN_DOMAIN}${path}`;
  const enCanonical =
    path === '/wat-is-homecheff'
      ? `${MAIN_DOMAIN}/en/what-is-homecheff`
      : nlCanonical;
  const canonical = lang === 'en' ? enCanonical : nlCanonical;

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
        'nl-NL': nlCanonical,
        'en-US': enCanonical,
        'x-default': `${MAIN_DOMAIN}/`,
      },
    },
    robots: { index: true, follow: true },
  };
}
