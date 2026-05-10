'use client';
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import { Compass, Users, Briefcase, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Language } from "@/hooks/useTranslation";
import Logo from "@/components/Logo";
import StructuredData from "@/components/seo/StructuredData";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import { useUserBootstrap } from "@/components/user/UserBootstrapProvider";
import { MAIN_DOMAIN } from "@/lib/seo/constants";
import HcpActivationCard from "@/components/gamification/HcpActivationCard";
import AndroidBetaHomeCta from "@/components/home/AndroidBetaHomeCta";

type HomeFeedChip = 'all' | 'sale' | 'inspiration';

const SPLASH_STORAGE_KEY = 'homecheff_splash_dismissed';

/** Lazy chunk: voorkomt webpack/module-boundary issues bij statische bundeling met de tour. */
const OnboardingTour = dynamic(
  () => import("@/components/onboarding/OnboardingTour"),
  { ssr: false }
);

const GeoFeed = dynamic(
  () => import("@/components/feed/GeoFeed"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-48 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
        <div className="h-32 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
      </div>
    ),
  }
);

function pickFirstName(
  user: { name?: string | null; email?: string | null } | undefined
): string | null {
  if (!user) return null;
  const raw = user.name?.trim();
  if (raw) {
    const first = raw.split(/\s+/)[0];
    return first || null;
  }
  const local = user.email?.split("@")[0]?.trim();
  if (!local) return null;
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

type Props = {
  initialInspiratieItems?: InspirationItem[];
  initialFeedChip?: HomeFeedChip;
};

export default function HomePageClient({
  initialInspiratieItems = [],
  initialFeedChip,
}: Props) {
  const { t, tOr, language, changeLanguage } = useTranslation();
  const { data: session } = useSession();
  const { profile: bootstrapProfile } = useUserBootstrap();
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [currentDomain, setCurrentDomain] = useState(MAIN_DOMAIN);
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);
  const [affiliateCheckComplete, setAffiliateCheckComplete] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem(SPLASH_STORAGE_KEY) : null;
      setSplashDismissed(stored === '1');
    } catch {
      setSplashDismissed(false);
    }
  }, []);

  const dismissSplash = () => {
    setSplashDismissed(true);
    try {
      sessionStorage.setItem(SPLASH_STORAGE_KEY, '1');
    } catch {}
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fromHtml = document.documentElement.getAttribute('data-domain');
      setCurrentDomain(fromHtml || window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsSubAffiliate(false);
      setAffiliateCheckComplete(true);
      return;
    }
    if (!bootstrapProfile) {
      setAffiliateCheckComplete(false);
      return;
    }
    setIsSubAffiliate(!!bootstrapProfile.affiliate?.parentAffiliateId);
    setAffiliateCheckComplete(true);
  }, [session?.user, bootstrapProfile]);
  
  const handleLanguageChange = async (newLanguage: Language) => {
    if (language !== newLanguage) await changeLanguage(newLanguage);
  };
  
  const splashTitle = tOr(
    'splash.title',
    'Discover digital studios, gardens and kitchens in your neighborhood — or share yours and earn extra.',
    'Ontdek digitale ateliers, tuinen en keukens in jouw buurt — of deel de jouwe en verdien extra.'
  );

  const splashSubtitle = tOr(
    'splash.subtitle',
    'Collect inspiration, sell what you make for free, with direct payouts. Your neighborhood becomes your village square.',
    'Verzamel inspiratie, verkoop gratis wat je maakt, met directe uitbetalingen. Jouw buurt wordt jouw dorpsplein.'
  );

  const splashValueProposition = tOr(
    'splash.valueProposition',
    'Local and transparent: discover makers, chat on the village square, and check out safely when you are ready to try something new.',
    'Lokaal en transparant: ontdek makers, praat mee op het dorpsplein, en reken veilig af wanneer je klaar bent om iets te proberen.'
  );

  const discoverLabel = tOr('bottomNav.discoverTab', 'Discover', 'Ontdekken');

  const firstName = pickFirstName(session?.user);
  const welcomeFromT = firstName
    ? t('home.welcomeFirstName', { name: firstName }).trim()
    : '';
  const welcomeLine =
    firstName &&
    (welcomeFromT ||
      (language === 'en' ? `Welcome, ${firstName}!` : `Welkom, ${firstName}!`));

  const affiliateText = tOr(
    'splash.affiliate',
    'Affiliate 12-12',
    'Affiliate 12-12'
  );
  const affiliateTemporaryText = tOr(
    'splash.affiliateTemporary',
    '⚠️ Temporary! We are accepting affiliates',
    '⚠️ Tijdelijk! We nemen affiliates aan'
  );

  const schemaOrgDescription = tOr(
    'home.schemaOrganizationDescription',
    'HomeCheff is a local platform where individuals can sell their handmade products.',
    'HomeCheff is een lokaal platform waar particulieren hun handgemaakte producten kunnen verkopen.'
  );
  const schemaWebsiteDescription = tOr(
    'home.schemaWebsiteDescription',
    'HomeCheff — discover digital studios, gardens, and kitchens in your neighborhood.',
    'HomeCheff - Ontdek digitale ateliers, tuinen en keukens in jouw buurt.'
  );
  const schemaContactType = tOr(
    'home.schemaContactCustomerService',
    'Customer service',
    'Klantenservice'
  );
  const schemaAreaCountry = tOr(
    'home.schemaAreaServedCountry',
    'Netherlands',
    'Nederland'
  );
  const schemaLang1 = tOr('home.schemaAvailableLang1', 'Dutch', 'Nederlands');
  const schemaLang2 = tOr('home.schemaAvailableLang2', 'English', 'Engels');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HomeCheff',
    alternateName: ['homecheff', 'home cheff', 'home-cheff', 'homechef', 'home chef', 'HomeCheff platform', 'HomeCheff marktplaats', 'HomeCheff marketplace', 'HomeCheff app', 'HomeCheff website', 'HomeCheff Netherlands', 'HomeCheff Europe'],
    url: currentDomain,
    logo: { '@type': 'ImageObject', url: `${currentDomain}/logo.png` },
    description: schemaOrgDescription,
    contactPoint: { '@type': 'ContactPoint', contactType: schemaContactType, email: 'support@homecheff.eu', availableLanguage: [schemaLang1, schemaLang2] },
    areaServed: { '@type': 'Country', name: schemaAreaCountry },
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${currentDomain}/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
  };
  
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HomeCheff',
    alternateName: ['homecheff', 'home cheff', 'home-cheff', 'homechef', 'home chef', 'HomeCheff platform', 'HomeCheff marketplace'],
    url: currentDomain,
    description: schemaWebsiteDescription,
    publisher: { '@type': 'Organization', name: 'HomeCheff' },
    inLanguage: language === 'nl' ? 'nl-NL' : 'en-US',
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${currentDomain}/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
  };
  
  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={websiteStructuredData} />
      {!splashDismissed && (
        <section className="relative bg-gradient-to-br from-primary-brand via-emerald-600 to-secondary-600 py-6 sm:py-8 px-4 sm:px-6 shadow-lg">
          <button type="button" onClick={dismissSplash} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" aria-label={tOr('home.splashDismissAria', 'Close welcome banner', 'Welkomstblok sluiten')}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-3 sm:mb-4 pointer-events-none">
              <div className="[&_span]:!text-white [&_span]:!drop-shadow-lg [&_svg_path]:drop-shadow-md [&_svg_circle]:drop-shadow-md [&_svg_rect]:drop-shadow-md">
                <Logo size="lg" showText={true} className="pointer-events-none" />
              </div>
            </div>
            <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <button type="button" onClick={() => handleLanguageChange('nl')} className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-semibold text-sm transition-all ${language === 'nl' ? 'bg-white text-primary-brand shadow-lg' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30'}`}>{tOr('home.heroLangNl', '🇳🇱 NL', '🇳🇱 NL')}</button>
              <button type="button" onClick={() => handleLanguageChange('en')} className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-semibold text-sm transition-all ${language === 'en' ? 'bg-white text-primary-brand shadow-lg' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30'}`}>{tOr('home.heroLangEn', '🇬🇧 EN', '🇬🇧 EN')}</button>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 leading-tight px-2">{splashTitle}</h1>
            <p className="text-sm sm:text-base text-primary-100 mb-2 max-w-2xl mx-auto px-2">{splashSubtitle}</p>
            <p className="text-xs sm:text-sm text-white/90 mb-4 sm:mb-5 max-w-xl mx-auto px-2">{splashValueProposition}</p>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <Link
                href="/#homecheff-feed"
                prefetch={false}
                scroll={false}
                className={cn(
                  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-medium sm:text-base sm:py-3',
                  'bg-primary-brand text-white shadow-lg transition-all duration-200',
                  'hover:bg-primary-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
                  'touch-manipulation select-none'
                )}
              >
                <Compass className="w-4 h-4 shrink-0" aria-hidden />
                {discoverLabel}
              </Link>
            </div>
            <p className="text-xs text-white/80 mt-4">
              <Link href="/#homecheff-feed" className="underline hover:text-white">{discoverLabel}</Link>
              {' · '}
              <Link href="/faq" className="underline hover:text-white">{t('siteFooter.faq')}</Link>
            </p>
          </div>
        </section>
      )}
      <main className="min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {session?.user && welcomeLine && (
            <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 text-center sm:text-left">
              {welcomeLine}
            </p>
          )}
          {session?.user ? <HcpActivationCard className="mb-4 sm:mb-5" /> : null}
          <AndroidBetaHomeCta className="mb-4 sm:mb-5" />
          <GeoFeed
            initialInspiratieItems={initialInspiratieItems}
            initialFeedChip={initialFeedChip}
          />
        </div>
        <section className="max-w-7xl mx-auto px-3 sm:px-4 pb-10 pt-2 border-t border-gray-200/80">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {tOr('home.moreSectionHeading', 'More', 'Meer')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(!isSubAffiliate || !affiliateCheckComplete) && (
              <Link
                href="/affiliate"
                className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50/80 p-4 hover:border-orange-300 transition-colors"
              >
                <Users className="w-8 h-8 shrink-0 text-orange-600" aria-hidden />
                <span>
                  <span className="block font-semibold text-gray-900">{affiliateText}</span>
                  <span className="text-sm text-gray-600 mt-0.5 block">{affiliateTemporaryText}</span>
                </span>
              </Link>
            )}
            <Link
              href="/werken-bij"
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 hover:border-emerald-300 transition-colors"
            >
              <Briefcase className="w-8 h-8 shrink-0 text-emerald-700" aria-hidden />
              <span>
                <span className="block font-semibold text-gray-900">{t('werkenBij.title')}</span>
                <span className="text-sm text-gray-600 mt-0.5 block line-clamp-2">{t('werkenBij.subtitle')}</span>
              </span>
            </Link>
          </div>
        </section>
      </main>
      <OnboardingTour pageId="home" autoStart={false} />
      <OnboardingTour pageId="inspiratie" autoStart={false} />
    </>
  );
}
