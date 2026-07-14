import './globals.css';
import Providers from '@/components/Providers';
import AppPageChrome from '@/components/AppPageChrome';
import RootEntityGraphScripts from '@/components/seo/RootEntityGraphScripts';
import NavBarShell from '@/components/navigation/NavBarShell';
import { headers, cookies } from 'next/headers';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { MAIN_DOMAIN, getMetadataBaseFromHeaders, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { getPlatformDefinition, PLATFORM_KEYWORDS } from '@/lib/seo/platform-definition';

// Lazy load non-critical components for faster initial page load
const PrivacyNotice = dynamic(() => import('@/components/PrivacyNotice'), {
  ssr: false,
});
const AndroidBetaOnboardingGate = dynamic(() => import('@/components/beta/AndroidBetaOnboardingGate'), {
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
const NavBar = dynamic(() => import('@/components/NavBar'), {
  loading: () => <NavBarShell />,
});

// Tab- + touch-icons: app/icon.png + app/apple-icon.png (Next). /favicon.ico komt uit public/ + expliciete link met query (Safari cache op blote /favicon.ico).
// Bump FAVICON_ASSET_Q when je favicon/apple-touch vervangt zodat Safari geen oude (bijv. default host) ico blijft tonen.
const OG_IMAGE_Q = '?v=hc6';
const FAVICON_ASSET_Q = '?v=hc7';

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

  const platform = getPlatformDefinition(lang);

  if (lang === 'en') {
    return {
      metadataBase,
      manifest: '/manifest.json',
      title: {
        default: platform.defaultTitle,
        template: '%s | HomeCheff',
      },
      description: platform.defaultDescription,
      keywords: PLATFORM_KEYWORDS.en,
      openGraph: {
        title: platform.defaultTitle,
        description: platform.defaultDescription,
        type: 'website',
        url: currentDomain,
        siteName: 'HomeCheff',
        locale: 'en_US',
        alternateLocale: ['nl_NL'],
        images: [{ url: `${MAIN_DOMAIN}/icon-192.png${OG_IMAGE_Q}`, width: 192, height: 192, alt: 'HomeCheff' }],
      },
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
      default: platform.defaultTitle,
      template: '%s | HomeCheff',
    },
    description: platform.defaultDescription,
    keywords: PLATFORM_KEYWORDS.nl,
    openGraph: {
      title: platform.defaultTitle,
      description: platform.defaultDescription,
      type: 'website',
      url: currentDomain,
      siteName: 'HomeCheff',
      locale: 'nl_NL',
      alternateLocale: ['en_US'],
      images: [{ url: `${MAIN_DOMAIN}/icon-192.png${OG_IMAGE_Q}`, width: 192, height: 192, alt: 'HomeCheff' }],
    },
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
  /** Notch/statusbar: laat env(safe-area-inset-*) werken in Capacitor / PWA-shell */
  viewportFit: 'cover' as const,
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
        <RootEntityGraphScripts />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()){document.documentElement.classList.add('hc-native-capacitor');}}catch(e){}})();",
          }}
        />
        <link
          rel="icon"
          href={`/favicon.ico${FAVICON_ASSET_Q}`}
          type="image/x-icon"
          sizes="any"
        />
        <link
          rel="apple-touch-icon"
          href={`/apple-touch-icon.png${FAVICON_ASSET_Q}`}
          sizes="180x180"
        />
        {/* app/icon.png + app/apple-icon.png: extra Next metadata links. Manifest: generateMetadata. */}
        {/* DNS prefetch for external resources (preconnect met wildcard geeft certificaatwaarschuwing) */}
        {/* Primaire media-CDN (feed-afbeeldingen/video's): DNS vroeg resolven zodat media sneller verbindt (UX-FIN-4B.16). */}
        <link rel="dns-prefetch" href="https://blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://platform-lookaside.fbsbx.com" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased overflow-x-clip max-w-[100vw] w-full">
        <Providers>
          <SkipLink />
          <PerformanceMonitor />
          <ConsentAwareAnalytics />
          <Preloader />
          <ToastNotification />
          <UserValidation />
          <OnlineStatusTracker />
          <NavBar />
          <AppPageChrome>
            <main id="main-content" tabIndex={-1} className="min-w-0 outline-none">
              {children}
            </main>
            <Footer />
          </AppPageChrome>
          <BottomNavigation />
          <AndroidBetaOnboardingGate />
          <PrivacyNotice />
        </Providers>
      </body>
    </html>
  );
}
