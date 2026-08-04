'use client';

import dynamic from 'next/dynamic';
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import HomeHeroSection from "@/components/home/HomeHeroSection";
import { scrollToHomeFeed } from "@/lib/guest/guest-explanation-panels";
import {
  readScrollPosition,
  HOME_FEED_DESKTOP_SCROLL_KEY,
  HOME_FEED_WINDOW_SCROLL_KEY,
} from "@/lib/appResumeCache";
import { useVisibleHomePromotionIds } from "@/hooks/useVisibleHomePromotions";
import { useNarrowViewportResolved } from "@/hooks/useNarrowViewport";
import type { SsrAuthHint } from "@/lib/feed/anonymous-session-fast-path";
import type { HomepageSsrIdentity } from "@/lib/seo/homepage-ssr-identity";
import {
  feedPerfMark,
  installFeedPerfBaselineReporter,
} from "@/lib/feed/feed-performance-baseline";
import GeoFeed, { FeedContent } from "@/components/home/HomeGeoFeedDynamic";
import FeedControlledHostShell from "@/components/adaptive-workspace/FeedControlledHostShell";
import FeedWorkspaceVisibleLayout from "@/components/adaptive-workspace/FeedWorkspaceVisibleLayout";
import WorkspaceOrientationStrip from "@/components/adaptive-workspace/WorkspaceOrientationStrip";
import { WorkspaceFeedPresentationBridge } from "@/components/adaptive-workspace/WorkspaceFeedPresentationBridge";
import { createControlledFeedHostContract } from "@/lib/adaptive-workspace/sealed/create-controlled-feed-host-contract";
import { createControlledFeedHostShadowPlacement } from "@/lib/adaptive-workspace/sealed/controlled-feed-host-shadow-placement";
import { createFeedDiscoveryControlledHostDescriptor } from "@/lib/adaptive-workspace/sealed/controlled-host-registry";
import type { FeedWorkspaceVisibilityMode } from "@/lib/adaptive-workspace-react";
import { isFeedWorkspaceLayoutVisible } from "@/lib/adaptive-workspace-react";

import type { FeedViewFilterId } from '@/lib/feed/feed-taxonomy';

/** Phase 3B.3.2/3B.3.3 — module-stable metadata. */
const FEED_CONTROLLED_HOST_CONTRACT = createControlledFeedHostContract();
const FEED_HOST_SHADOW_PLACEMENT = createControlledFeedHostShadowPlacement();
const FEED_HOST_DESCRIPTOR = createFeedDiscoveryControlledHostDescriptor();

const PostAuthPersonaBanner = dynamic(
  () => import("@/components/onboarding/PostAuthPersonaBanner"),
  { ssr: false },
);
const HomeDesktopSidebar = dynamic(
  () => import("@/components/home/HomeDesktopSidebar"),
  { ssr: false },
);
const HomeDesktopLeftSidebar = dynamic(
  () => import("@/components/home/HomeDesktopLeftSidebar"),
  { ssr: false },
);
const UserActionCenter = dynamic(
  () => import("@/components/home/UserActionCenter"),
  { ssr: false },
);
const HomeMobileEcosystemStrip = dynamic(
  () => import("@/components/home/HomeMobileEcosystemStrip"),
  { ssr: false },
);
const HomeMobileFeedInsert = dynamic(
  () => import("@/components/home/HomeMobileFeedInserts"),
  { ssr: false },
);
const OnboardingTour = dynamic(
  () => import("@/components/onboarding/OnboardingTour"),
  { ssr: false },
);

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
  ssrAuthHint?: SsrAuthHint;
  ssrIdentity?: HomepageSsrIdentity;
  initialFeedChip?: HomeFeedChip;
  initialFeedCategory?: string;
  initialFeedPlace?: string;
  stickyTestMode?: boolean;
  feedWorkspaceVisibilityMode?: FeedWorkspaceVisibilityMode;
  feedWorkspacePreviewRequested?: boolean;
};

export default function HomePageClient({
  ssrAuthHint,
  ssrIdentity,
  initialFeedChip,
  initialFeedCategory,
  initialFeedPlace,
  stickyTestMode = false,
  feedWorkspaceVisibilityMode = "off",
  feedWorkspacePreviewRequested = false,
}: Props) {
  const { t, tOr, language } = useTranslation();
  const { data: session } = useSession();
  const visibleHomePromotionIds = useVisibleHomePromotionIds();
  const { narrow: isNarrowHome } = useNarrowViewportResolved();

  const layoutVisible = isFeedWorkspaceLayoutVisible({
    mode: feedWorkspaceVisibilityMode,
    previewRequested: feedWorkspacePreviewRequested,
  });

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
    const timer = window.setTimeout(() => scrollToHomeFeed(), 400);
    return () => window.clearTimeout(timer);
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

  /** Legacy OFF path only — Phase 3F.5 composed desktop grid. */
  const showDesktopComposedLayout = !isNarrowHome && !stickyTestMode;

  /** WX 1A — keep mobile chrome compact; ecosystem strip is secondary (not above-fold mandatory). */
  const mobileChrome = (
    <div className="min-w-0 lg:hidden">
      {session?.user ? (
        <div className="mb-2">
          <UserActionCenter variant="mobileCompact" />
        </div>
      ) : null}
      {!layoutVisible ? (
        <HomeMobileEcosystemStrip
          isLoggedIn={Boolean(session?.user)}
          className="mb-3"
        />
      ) : null}
    </div>
  );

  const legacyFeedTree = (
    <>
      {mobileChrome}
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
      <FeedControlledHostShell
        contract={FEED_CONTROLLED_HOST_CONTRACT}
        placement={FEED_HOST_SHADOW_PLACEMENT}
        hostDescriptor={FEED_HOST_DESCRIPTOR}
        visibilityMode={feedWorkspaceVisibilityMode}
        layoutVisible={false}
      />
    </>
  );

  /**
   * Hardened PREVIEW/ON tree — one permanent GeoFeed parent chain:
   * Shell → VisibleLayout → primary slot → GeoFeed
   * Crossing lg / orientation only toggles rails + grid CSS, not GeoFeed identity.
   * homeComposedLayout=false so GeoFeed never hits the mobile+composed null path.
   */
  const visibleWorkspaceTree = (
    <>
      {mobileChrome}
      <WorkspaceFeedPresentationBridge>
        <FeedControlledHostShell
          contract={FEED_CONTROLLED_HOST_CONTRACT}
          placement={FEED_HOST_SHADOW_PLACEMENT}
          hostDescriptor={FEED_HOST_DESCRIPTOR}
          visibilityMode={feedWorkspaceVisibilityMode}
          layoutVisible
        >
          <FeedWorkspaceVisibleLayout
            ariaLabel={tOr('feed.discoverFiltersHeading', 'Discover', 'Ontdekken')}
            orientation={<WorkspaceOrientationStrip ssrIdentity={ssrIdentity} />}
            primary={<GeoFeed {...geoFeedProps} homeComposedLayout={false} />}
            startPanel={<HomeDesktopLeftSidebar />}
            endPanel={<HomeDesktopSidebar welcomeLine={welcomeLine} />}
          />
        </FeedControlledHostShell>
      </WorkspaceFeedPresentationBridge>
    </>
  );

  const pageShellClass = layoutVisible
    ? "hc-home-page-shell hc-aw-full-bleed hc-wx-shell w-full max-w-none mx-auto px-0 sm:px-2 lg:px-3 py-0 sm:py-2 bg-gray-100/70"
    : "hc-home-page-shell max-w-[1320px] mx-auto px-3 sm:px-4 py-3 sm:py-5";

  return (
    <>
      <PostAuthPersonaBanner />
      <div className="min-h-[60vh] hc-dorpsplein-page">
        <div className={pageShellClass}>
          {/* Legacy OFF path keeps marketing hero. AW ON uses WorkspaceOrientationStrip inside the grid. */}
          {!layoutVisible ? (
            <div className="max-w-3xl lg:max-w-none mx-auto mb-2 sm:mb-4 lg:mb-4">
              <HomeHeroSection ssrIdentity={ssrIdentity} />
            </div>
          ) : null}

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

          {!stickyTestMode ? (layoutVisible ? visibleWorkspaceTree : legacyFeedTree) : null}
        </div>
      </div>
      <OnboardingTour pageId="home" autoStart={false} />
      <OnboardingTour pageId="inspiratie" autoStart={false} />
    </>
  );
}
