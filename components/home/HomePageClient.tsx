'use client';

import { useTranslation } from "@/hooks/useTranslation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
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
import type { SsrAuthHint } from "@/lib/feed/anonymous-session-fast-path";
import {
  feedPerfMark,
  installFeedPerfBaselineReporter,
} from "@/lib/feed/feed-performance-baseline";

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
  /** SSR session hint from getServerSession — enables anonymous feed fast-path. */
  ssrAuthHint?: SsrAuthHint;
  initialFeedChip?: HomeFeedChip;
  initialFeedCategory?: string;
  initialFeedPlace?: string;
  /** SSR ?stickyTest=1 — minimal sticky proof grid */
  stickyTestMode?: boolean;
};

export default function HomePageClient({
  ssrAuthHint,
  initialFeedChip,
  initialFeedCategory,
  initialFeedPlace,
  stickyTestMode = false,
}: Props) {
  const { t, tOr, language } = useTranslation();
  const { data: session } = useSession();
  const visibleHomePromotionIds = useVisibleHomePromotionIds();
  const { narrow: isNarrowHome } = useNarrowViewportResolved();

  useEffect(() => {
    installFeedPerfBaselineReporter();
    feedPerfMark("home:shell-mounted");
    feedPerfMark("home:viewport-resolved");
    feedPerfMark("layout:hydration-complete");
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

  const geoFeedProps = {
    ssrAuthHint,
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

  /** Phase 3F.5: single GeoFeed instance; layout toggles via prop (no unmount/remount). */
  const showDesktopComposedLayout = !isNarrowHome && !stickyTestMode;

  return (
    <>
      <PostAuthPersonaBanner />
      <div className="min-h-[60vh] hc-dorpsplein-page">
        <div className="hc-home-page-shell max-w-[1320px] mx-auto px-3 sm:px-4 py-3 sm:py-5">
          <div className="max-w-3xl lg:max-w-none mx-auto mb-2 sm:mb-4 lg:mb-4">
            <HomeHeroSection />
          </div>

          {stickyTestMode && showDesktopComposedLayout ? (
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

          {!stickyTestMode ? (
            <>
              <div className="min-w-0 lg:hidden">
                  {session?.user ? (
                    <div className="mb-3">
                      <UserActionCenter variant="mobileCompact" />
                    </div>
                  ) : null}
                  <HomeMobileEcosystemStrip
                    isLoggedIn={Boolean(session?.user)}
                    className="mb-3"
                  />
                </div>

              <GeoFeed
                {...geoFeedProps}
                homeComposedLayout={showDesktopComposedLayout}
              >
                {showDesktopComposedLayout ? (
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
                ) : null}
              </GeoFeed>
            </>
          ) : null}
        </div>
      </div>
      <OnboardingTour pageId="home" autoStart={false} />
      <OnboardingTour pageId="inspiratie" autoStart={false} />
    </>
  );
}
