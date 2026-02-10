import './globals.css';
import Providers from '@/components/Providers';
import NavBar from '@/components/NavBar';
import { headers, cookies } from 'next/headers';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

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
const VercelAnalytics = dynamic(() => import('@/components/VercelAnalytics'), {
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

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const languageHeader = headersList.get('X-HomeCheff-Language');
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('homecheff-language');
  
  let lang = 'nl';
  if (languageHeader === 'nl' || languageHeader === 'en') {
    lang = languageHeader;
  } else if (languageCookie?.value === 'nl' || languageCookie?.value === 'en') {
    lang = languageCookie.value;
  }

  const hostname = headersList.get('host') || '';
  const isEnglishDomain = hostname.includes('homecheff.eu');
  const currentDomain = isEnglishDomain ? 'https://homecheff.eu' : 'https://homecheff.nl';
  const alternateDomain = isEnglishDomain ? 'https://homecheff.nl' : 'https://homecheff.eu';

  if (lang === 'en') {
    return {
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
      },
      alternates: {
        canonical: currentDomain,
        languages: {
          'nl-NL': alternateDomain,
          'en-US': currentDomain,
        },
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
    },
    alternates: {
      canonical: currentDomain,
      languages: {
        'nl-NL': currentDomain,
        'en-US': alternateDomain,
      },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://*.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://*.public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://platform-lookaside.fbsbx.com" />
        {/* Preload critical fonts */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          <PerformanceMonitor />
          <VercelAnalytics />
          <Preloader />
          <ToastNotification />
          <UserValidation />
          <OnlineStatusTracker />
          <NavBar />
          {children}
          <BottomNavigation />
          <PrivacyNotice />
        </Providers>
      </body>
    </html>
  );
}
