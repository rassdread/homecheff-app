import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';

export async function generateMetadata({
  params,
}: {
  params?: Promise<{ userId?: string }> | { userId?: string };
}): Promise<Metadata> {
  const resolved = params ? await Promise.resolve(params) : undefined;
  if (resolved && 'userId' in resolved && resolved.userId) {
    // Dynamic /profile/[userId] owns its metadata (including notFound).
    return {};
  }
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

  return {
    title: lang === 'en' ? 'Profile | HomeCheff' : 'Profiel | HomeCheff',
  };
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
