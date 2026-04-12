import './globals.css';
import Providers from '@/components/Providers';
import NavBar from '@/components/NavBar';
import { headers, cookies } from 'next/headers';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { MAIN_DOMAIN, getMetadataBaseFromHeaders, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';

// Lazy load non-critical components for faster initial page load
const PrivacyNotice = dynamic(() => import('@/components/PrivacyNotice'), {
  ssr: false,
});
const UserValidation = dynamic(() => import('@/components/UserValidation'), {
  ssr: false,
});
const PerformanceMonitor = dynamic(() => import('@/components/PerformanceMonitor'), {
  ssr: false,
});
const ConsentAwareAnalytics = dynamic(() => import('@/components/ConsentAwareAnalytics'), {
  ssr: false,
});
const Preloader = dynamic(() => import('@/components/Preloader'), {
  ssr: false,
});
const ToastNotification = dynamic(() => import('@/components/notifications/ToastNotification'), {
  ssr: false,
});
const OnlineStatusTracker = dynamic(() => import('@/components/OnlineStatusTracker'), {
  ssr: false,
});
const BottomNavigation = dynamic(() => import('@/components/navigation/BottomNavigation'), {
  ssr: false,
});
const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
});
const SkipLink = dynamic(() => import('@/components/SkipLink'), {
  ssr: false,
});

// PNG first; ?v= busts Safari tab-favicon cache. Geen X-Frame-Options op deze URLs (vercel.json sluit ze uit bij /(.*) security).
const FAVICON_Q = '?v=hc3';
const siteIcons: Metadata['icons'] = {
  icon: [
    { url: `/favicon-32.png${FAVICON_Q}`, sizes: '32x32', type: 'image/png' },
    { url: `/favicon-48.png${FAVICON_Q}`, sizes: '48x48', type: 'image/png' },
    { url: `/icon-192.png${FAVICON_Q}`, sizes: '192x192', type: 'image/png' },
    { url: `/favicon.ico${FAVICON_Q}`, sizes: 'any' },
  ],
  apple: `/apple-touch-icon.png${FAVICON_Q}`,
};

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const metadataBase = getMetadataBaseFromHeaders(headersList);
  const hostname = headersList.get('host') || '';
  const isEnglishDomain = hostname.includes('homecheff.eu');
  const currentDomain = MAIN_DOMAIN;

  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');
  let lang: 'nl' | 'en' = 'nl';
  if (languageHeader === 'nl' || languageHeader === 'en') {
    lang = languageHeader;
  } else if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    lang = languageCookie.value as 'nl' | 'en';
  } else {
    lang = isEnglishDomain ? 'en' : 'nl';
  }

  if (lang === 'en') {
    return {
      metadataBase,
      manifest: '/manifest.json',
      title: {
        default: 'HomeCheff - Discover Digital Studios, Gardens and Kitchens',
        template: '%s | HomeCheff',
      },
      description: 'HomeCheff - Discover digital studios, gardens and kitchens in your neighborhood — or share yours and earn extra. Collect inspiration, sell what you make for free, with direct payouts. Your neighborhood becomes your village square.',
      keywords: [
        'HomeCheff', 'homecheff', 'home cheff', 'home-cheff', 'homechef', 'home chef',
        'HomeCheff platform', 'HomeCheff marketplace', 'HomeCheff app', 'HomeCheff website',
        'HomeCheff Netherlands', 'HomeCheff Europe', 'HomeCheff local', 'HomeCheff neighborhood',
        'homemade', 'local', 'handmade', 'recipes', 'local marketplace', 'community marketplace',
        'homemade meals', 'fresh produce', 'handmade creations', 'local cooking',
        'digital studios', 'digital gardens', 'digital kitchens',
        'sell homemade', 'buy local', 'local shopping', 'support local',
      ],
      openGraph: {
        title: 'HomeCheff - Discover Digital Studios, Gardens and Kitchens',
        description: 'HomeCheff - Discover digital studios, gardens and kitchens in your neighborhood — or share yours and earn extra.',
        type: 'website',
        url: currentDomain,
        siteName: 'HomeCheff',
        locale: 'en_US',
        alternateLocale: ['nl_NL'],
        images: [{ url: '/icon-192.png', width: 192, height: 192, alt: 'HomeCheff' }],
      },
      icons: siteIcons,
      alternates: {
        canonical: currentDomain,
        languages: seoHreflangLanguagesOnEu(''),
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  }

  return {
    metadataBase,
    manifest: '/manifest.json',
    title: {
      default: 'HomeCheff - Ontdek Digitale Ateliers, Tuinen en Keukens',
      template: '%s | HomeCheff',
    },
    description: 'HomeCheff - Ontdek digitale ateliers, tuinen en keukens in jouw buurt — of deel de jouwe en verdien extra. Verzamel inspiratie, verkoop gratis wat je maakt, met directe uitbetalingen. Jouw buurt wordt jouw dorpsplein.',
    keywords: [
      'HomeCheff', 'homecheff', 'home cheff', 'home-cheff', 'homechef', 'home chef',
      'HomeCheff platform', 'HomeCheff marktplaats', 'HomeCheff app', 'HomeCheff website',
      'HomeCheff Nederland', 'HomeCheff lokaal', 'HomeCheff buurt',
      'thuisgemaakt', 'lokaal', 'handgemaakt', 'recepten', 'lokale marktplaats',
      'thuisgemaakte maaltijden', 'verse oogst', 'handgemaakte creaties', 'lokaal koken',
      'digitale ateliers', 'digitale tuinen', 'digitale keukens',
    ],
    openGraph: {
      title: 'HomeCheff - Ontdek Digitale Ateliers, Tuinen en Keukens',
      description: 'HomeCheff - Ontdek digitale ateliers, tuinen en keukens in jouw buurt — of deel de jouwe en verdien extra.',
      type: 'website',
      url: currentDomain,
      siteName: 'HomeCheff',
      locale: 'nl_NL',
      alternateLocale: ['en_US'],
      images: [{ url: '/icon-192.png', width: 192, height: 192, alt: 'HomeCheff' }],
    },
    icons: siteIcons,
    alternates: {
      canonical: currentDomain,
      languages: seoHreflangLanguagesOnEu(''),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility (was: 1)
  userScalable: true, // Allow zoom - false can cause scroll issues on mobile Chrome
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');
  const isEnglishDomain = hostname.includes('homecheff.eu');
  // Cookie/header overrides domain so header and logo subtitle match chosen language (EN vs NL)
  let htmlLang: 'en' | 'nl' = isEnglishDomain ? 'en' : 'nl';
  if (languageHeader === 'nl' || languageHeader === 'en') {
    htmlLang = languageHeader;
  } else if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    htmlLang = languageCookie.value as 'en' | 'nl';
  }
  return (
    <html lang={htmlLang} data-domain={MAIN_DOMAIN}>
      <head>
        {/* Icons + manifest: single source of truth in generateMetadata (avoids duplicate link tags). */}
        {/* DNS prefetch for external resources (preconnect met wildcard geeft certificaatwaarschuwing) */}
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://platform-lookaside.fbsbx.com" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased overflow-x-hidden max-w-[100vw] w-full">
        <Providers>
          <SkipLink />
          <PerformanceMonitor />
          <ConsentAwareAnalytics />
          <Preloader />
          <ToastNotification />
          <UserValidation />
          <OnlineStatusTracker />
          <NavBar />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <BottomNavigation />
          <PrivacyNotice />
        </Providers>
      </body>
    </html>
  );
}
