import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { NOT_FOUND_METADATA } from '@/lib/seo/not-found-metadata';
import nl from '@/public/i18n/nl.json';
import en from '@/public/i18n/en.json';

export const metadata = NOT_FOUND_METADATA;

async function requestLanguage(): Promise<'nl' | 'en'> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie =
    cookieStore.get('hc_locale')?.value || cookieStore.get('homecheff-language')?.value;
  if (languageHeader === 'nl' || languageHeader === 'en') return languageHeader;
  if (languageCookie === 'nl' || languageCookie === 'en') return languageCookie;
  const { resolveColdStartLanguage } = await import('@/lib/locale');
  return resolveColdStartLanguage({
    cookieLanguage: languageCookie,
    host: headersList.get('host') || '',
    countryCode: headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry'),
  });
}

export default async function NotFound() {
  const lang = await requestLanguage();
  const copy = (lang === 'nl' ? nl : en).notFound;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <meta name="robots" content="noindex, nofollow, noarchive" />
      <div className="text-center max-w-md w-full">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{copy.title}</h2>
        <p className="text-gray-600 mb-8">{copy.description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {copy.home}
          </Link>
          <Link
            href="/?chip=inspiration#homecheff-feed"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {copy.inspiratie}
          </Link>
        </div>
      </div>
    </div>
  );
}
