import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { getPlatformDefinition } from '@/lib/seo/platform-definition';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');

  let lang: 'nl' | 'en' = 'nl';
  if (languageHeader === 'nl' || languageHeader === 'en') {
    lang = languageHeader;
  } else if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    lang = languageCookie.value as 'nl' | 'en';
  }

  const currentDomain = MAIN_DOMAIN;

  const platform = getPlatformDefinition(lang);

  if (lang === 'en') {
    return {
      title: 'About Us - HomeCheff',
      description: platform.organizationDescription,
      openGraph: {
        title: 'About Us - HomeCheff',
        description: platform.entityDefinition,
        type: 'website',
        url: `${currentDomain}/over-ons`,
      },
      alternates: {
        canonical: `${currentDomain}/over-ons`,
        languages: seoHreflangLanguagesOnEu('/over-ons'),
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    title: 'Over ons - HomeCheff',
    description: platform.organizationDescription,
    openGraph: {
      title: 'Over ons - HomeCheff',
      description: platform.entityDefinition,
      type: 'website',
      url: `${currentDomain}/over-ons`,
    },
    alternates: {
      canonical: `${currentDomain}/over-ons`,
      languages: seoHreflangLanguagesOnEu('/over-ons'),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function OverOnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
