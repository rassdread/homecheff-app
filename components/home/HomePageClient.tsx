'use client';

import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { Users, Briefcase } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import { useUserBootstrap } from "@/components/user/UserBootstrapProvider";
import { MAIN_DOMAIN } from "@/lib/seo/constants";
import AndroidBetaHomeCta from "@/components/home/AndroidBetaHomeCta";
import AndroidBetaOptionalUpdateReminder from "@/components/app/AndroidBetaOptionalUpdateReminder";
import PostAuthPersonaBanner from "@/components/onboarding/PostAuthPersonaBanner";
import HomeHeroSection from "@/components/home/HomeHeroSection";
import HomeDesktopSidebar from "@/components/home/HomeDesktopSidebar";
import HomeMobileFeedInsert from "@/components/home/HomeMobileFeedInserts";
import GeoFeed, { FeedContent, FeedFiltersPanel } from "@/components/feed/GeoFeed";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { scrollToHomeFeed } from "@/lib/guest/guest-explanation-panels";

type HomeFeedChip = 'all' | 'sale' | 'inspiration';

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
  initialFeedCategory?: string;
  initialFeedPlace?: string;
  /** SSR ?stickyTest=1 — minimal sticky proof grid */
  stickyTestMode?: boolean;
};

export default function HomePageClient({
  initialInspiratieItems = [],
  initialFeedChip,
  initialFeedCategory,
  initialFeedPlace,
  stickyTestMode = false,
}: Props) {
  const { t, tOr, language } = useTranslation();
  const { data: session } = useSession();
  const { profile: bootstrapProfile } = useUserBootstrap();
  const [currentDomain, setCurrentDomain] = useState(MAIN_DOMAIN);
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);
  const [affiliateCheckComplete, setAffiliateCheckComplete] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fromHtml = document.documentElement.getAttribute('data-domain');
      setCurrentDomain(fromHtml || window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#homecheff-feed') return;
    const t = window.setTimeout(() => scrollToHomeFeed(), 400);
    return () => window.clearTimeout(t);
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

  const firstName = pickFirstName(session?.user);
  const welcomeLine =
    firstName &&
    (t('home.welcomeFirstName', { name: firstName }).trim() ||
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
    'homePhase1.schemaWebsiteDescription',
    'HomeCheff — the digital village square to discover and share local food, harvest and crafts.',
    'HomeCheff — het digitale dorpsplein om lokaal eten, oogst en creaties te ontdekken en te delen.'
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

  const geoFeedProps = {
    initialInspiratieItems,
    initialFeedChip,
    initialFeedCategory,
    initialFeedPlace,
    enableMobileFeedInserts: true as const,
    feedColumnLayout: 'home-main' as const,
    renderMobileFeedInsert: (insertId: import('@/lib/home/resolve-home-mobile-insert').HomeMobileFeedInsertId) => (
      <HomeMobileFeedInsert insertId={insertId} />
    ),
  };

  const desktopColScrollClass =
    'min-h-0 overflow-y-auto overscroll-y-contain pb-3 [-webkit-overflow-scrolling:touch]';

  const stickyAsideClass =
    'sticky top-20 z-[1] self-start max-h-[calc(100vh-5rem)] overflow-y-auto pb-3';

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={websiteStructuredData} />
      <PostAuthPersonaBanner />
      {/* div — layout.tsx already provides #main-content <main> */}
      <div className="min-h-[60vh] hc-dorpsplein-page">
        <div className="hc-home-page-shell max-w-[1320px] mx-auto px-3 sm:px-4 py-3 sm:py-5">
          {/* Hero — full shell width on desktop; stays narrow on mobile */}
          <div className="max-w-3xl lg:max-w-none mx-auto mb-2 sm:mb-4 lg:mb-4">
            <HomeHeroSection />
          </div>

          {/* Minimal sticky proof — ?stickyTest=1 on desktop */}
          {stickyTestMode ? (
            <section
              className="hc-home-sticky-grid max-lg:hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-6 items-start mb-8"
              data-sticky-test-shell
            >
              <aside data-sticky-test="left" className={`${stickyAsideClass} bg-red-100 p-4`}>
                LEFT TEST
              </aside>
              <div className="min-h-[3000px] bg-white p-4" data-sticky-test="center">
                FEED TEST
              </div>
              <aside data-sticky-test="right" className={`${stickyAsideClass} bg-blue-100 p-4`}>
                RIGHT TEST
              </aside>
            </section>
          ) : null}

          {/* Mobile / tablet feed */}
          <div className="lg:hidden min-w-0">
            <GeoFeed {...geoFeedProps} />
            <div className="mt-6 space-y-4">
              <AndroidBetaHomeCta />
              <AndroidBetaOptionalUpdateReminder />
            </div>
          </div>

          {/* Desktop: HomePageClient owns sticky grid; GeoFeed supplies filter + feed via context */}
          <div className="max-lg:hidden">
          {!stickyTestMode ? (
            <GeoFeed {...geoFeedProps} homeComposedLayout>
              <section
                className="hc-home-sticky-grid hc-home-desktop-shell lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-5 xl:gap-6 lg:items-stretch lg:h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-5rem)] lg:min-h-[28rem]"
                aria-label={tOr('feed.discoverFiltersHeading', 'Discover', 'Ontdekken')}
              >
                <aside data-sticky-prod="left" className={desktopColScrollClass}>
                  <FeedFiltersPanel />
                </aside>
                <div
                  id="homecheff-feed-desktop"
                  className={`${desktopColScrollClass} min-w-0 space-y-4 hc-home-feed-grid`}
                >
                  <FeedContent />
                </div>
                <aside data-sticky-prod="right" className={desktopColScrollClass}>
                  <HomeDesktopSidebar welcomeLine={welcomeLine} />
                </aside>
              </section>
            </GeoFeed>
          ) : null}
          </div>

          <div className="hidden lg:block mt-6 space-y-4">
            <AndroidBetaHomeCta />
            <AndroidBetaOptionalUpdateReminder />
          </div>
        </div>

        <section className="max-w-[1320px] mx-auto px-3 sm:px-4 pb-10 pt-4 border-t border-primary-brand/10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {tOr('home.moreSectionHeading', 'More', 'Meer')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
            {(!isSubAffiliate || !affiliateCheckComplete) && (
              <Link
                href="/affiliate"
                className="hc-dorpsplein-card flex items-start gap-3 p-4 border-orange-200/70 bg-gradient-to-br from-orange-50/80 to-white hover:border-orange-300 transition-colors"
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
              className="hc-dorpsplein-card flex items-start gap-3 p-4 border-primary-brand/20 bg-gradient-to-br from-primary-50/50 to-white hover:border-primary-brand/40 transition-colors"
            >
              <Briefcase className="w-8 h-8 shrink-0 text-primary-brand" aria-hidden />
              <span>
                <span className="block font-semibold text-gray-900">{t('werkenBij.title')}</span>
                <span className="text-sm text-gray-600 mt-0.5 block line-clamp-2">{t('werkenBij.subtitle')}</span>
              </span>
            </Link>
          </div>
        </section>
      </div>
      <OnboardingTour pageId="home" autoStart={false} />
      <OnboardingTour pageId="inspiratie" autoStart={false} />
    </>
  );
}
