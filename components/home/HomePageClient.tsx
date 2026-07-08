'use client';

import { useTranslation } from "@/hooks/useTranslation";
import StructuredData from "@/components/seo/StructuredData";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import { MAIN_DOMAIN } from "@/lib/seo/constants";
import PostAuthPersonaBanner from "@/components/onboarding/PostAuthPersonaBanner";
import HomeHeroSection from "@/components/home/HomeHeroSection";
import HomeDesktopSidebar from "@/components/home/HomeDesktopSidebar";
import HomeDesktopLeftSidebar from "@/components/home/HomeDesktopLeftSidebar";
import HomeMobileFeedInsert from "@/components/home/HomeMobileFeedInserts";
import UserActionCenter from "@/components/home/UserActionCenter";
import HomeMobileEcosystemStrip from "@/components/home/HomeMobileEcosystemStrip";
import GeoFeed, { FeedContent } from "@/components/feed/GeoFeed";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { scrollToHomeFeed } from "@/lib/guest/guest-explanation-panels";
import {
  readScrollPosition,
  HOME_FEED_DESKTOP_SCROLL_KEY,
  HOME_FEED_WINDOW_SCROLL_KEY,
} from "@/lib/appResumeCache";
import { useVisibleHomePromotionIds } from "@/hooks/useVisibleHomePromotions";
import { useNarrowViewportResolved } from "@/hooks/useNarrowViewport";

import type { FeedViewFilterId } from '@/lib/feed/feed-taxonomy';

type HomeFeedChip = FeedViewFilterId;

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
  const visibleHomePromotionIds = useVisibleHomePromotionIds();
  const { narrow: isNarrowHome, resolved: viewportResolved } =
    useNarrowViewportResolved();
  const [currentDomain, setCurrentDomain] = useState(MAIN_DOMAIN);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fromHtml = document.documentElement.getAttribute('data-domain');
      setCurrentDomain(fromHtml || window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#homecheff-feed') return;
    const savedWindow = readScrollPosition(HOME_FEED_WINDOW_SCROLL_KEY);
    const savedDesktop = readScrollPosition(HOME_FEED_DESKTOP_SCROLL_KEY);
    if (
      (savedWindow != null && savedWindow > 4) ||
      (savedDesktop != null && savedDesktop > 4)
    ) {
      return;
    }
    const t = window.setTimeout(() => scrollToHomeFeed(), 400);
    return () => window.clearTimeout(t);
  }, []);

  const firstName = pickFirstName(session?.user);
  const welcomeLine =
    firstName &&
    (t('home.welcomeFirstName', { name: firstName }).trim() ||
      (language === 'en' ? `Welcome, ${firstName}!` : `Welkom, ${firstName}!`));

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
    visibleHomePromotionIds,
    renderMobileFeedInsert: (insertId: import('@/lib/home/resolve-home-mobile-insert').HomeMobileFeedInsertId) => (
      <HomeMobileFeedInsert insertId={insertId} />
    ),
  };

  const desktopColScrollClass =
    'min-h-0 overflow-y-auto overscroll-y-contain pb-3 [-webkit-overflow-scrolling:touch]';

  const stickyAsideClass =
    'sticky top-20 z-[1] self-start max-h-[calc(100vh-5rem)] overflow-y-auto pb-3';

  /** After client viewport is known: exactly one GeoFeed tree (mobile or desktop). */
  const showMobileHomeFeed = viewportResolved && isNarrowHome;
  const showDesktopHomeFeed =
    viewportResolved && !isNarrowHome && !stickyTestMode;

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={websiteStructuredData} />
      <PostAuthPersonaBanner />
      <div className="min-h-[60vh] hc-dorpsplein-page">
        <div className="hc-home-page-shell max-w-[1320px] mx-auto px-3 sm:px-4 py-3 sm:py-5">
          <div className="max-w-3xl lg:max-w-none mx-auto mb-2 sm:mb-4 lg:mb-4">
            <HomeHeroSection />
          </div>

          {stickyTestMode && showDesktopHomeFeed ? (
            <section
              className="hc-home-sticky-grid lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-6 items-start mb-8"
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

          {showMobileHomeFeed ? (
            <div className="min-w-0">
              {session?.user ? (
                <div className="mb-3">
                  <UserActionCenter variant="mobileCompact" />
                </div>
              ) : null}
              <HomeMobileEcosystemStrip
                isLoggedIn={Boolean(session?.user)}
                className="mb-3"
              />
              <GeoFeed {...geoFeedProps} />
            </div>
          ) : null}

          {showDesktopHomeFeed ? (
            <GeoFeed {...geoFeedProps} homeComposedLayout>
              <section
                className="hc-home-sticky-grid hc-home-desktop-shell lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-5 xl:gap-6 lg:items-stretch lg:h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-5rem)] lg:min-h-[28rem]"
                aria-label={tOr('feed.discoverFiltersHeading', 'Discover', 'Ontdekken')}
              >
                <aside data-sticky-prod="left" className={desktopColScrollClass}>
                  <HomeDesktopLeftSidebar />
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
      </div>
      <OnboardingTour pageId="home" autoStart={false} />
      <OnboardingTour pageId="inspiratie" autoStart={false} />
    </>
  );
}
