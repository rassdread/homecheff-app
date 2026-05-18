import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { MAIN_DOMAIN, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { COMMUNITY_GUIDELINES_URL } from '@/lib/legal/policy-urls';

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

  const path = COMMUNITY_GUIDELINES_URL;
  const url = `${MAIN_DOMAIN}${path}`;

  if (lang === 'en') {
    return {
      title: 'Community Guidelines | HomeCheff',
      description: 'Community guidelines for respectful, safe use of HomeCheff.',
      openGraph: { title: 'Community Guidelines | HomeCheff', description: 'Community guidelines for HomeCheff.', type: 'website', url },
      alternates: { canonical: url, languages: seoHreflangLanguagesOnEu(path) },
      robots: { index: true, follow: true },
    };
  }

  return {
    title: 'Communityrichtlijnen | HomeCheff',
    description: 'Communityrichtlijnen voor respectvol en veilig gebruik van HomeCheff.',
    openGraph: { title: 'Communityrichtlijnen | HomeCheff', description: 'Communityrichtlijnen voor HomeCheff.', type: 'website', url },
    alternates: { canonical: url, languages: seoHreflangLanguagesOnEu(path) },
    robots: { index: true, follow: true },
  };
}

export default function CommunityGuidelinesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
