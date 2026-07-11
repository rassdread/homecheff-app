import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { LIVING_PLATFORM_SOURCES } from '@/lib/i18n/livingPlatformSources';
import { resolveLivingPlatformLang, lpMeta } from '@/lib/living-platform/server-i18n';

export async function buildLivingPlatformMetadata(
  path: string,
  namespace: string,
): Promise<Metadata> {
  const headersList = await headers();
  const cookieStore = await cookies();
  const lang = resolveLivingPlatformLang(
    headersList.get('X-HomeCheff-Language'),
    cookieStore.get('homecheff-language')?.value,
  );

  const src = LIVING_PLATFORM_SOURCES[namespace];
  if (!src?.metaTitle || !src?.metaDescription) {
    return { title: 'HomeCheff', robots: { index: false } };
  }

  const { title, description } = lpMeta(namespace, lang);
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
