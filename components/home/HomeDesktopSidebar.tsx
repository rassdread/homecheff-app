'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useGuestBottomNavPanel } from '@/hooks/useGuestBottomNavPanel';
import HomeReputationCompactCard from '@/components/home/HomeReputationCompactCard';
import CommunityPulseBar from '@/components/home/CommunityPulseBar';
import { DesktopRightSidebarSurfaceStack } from '@/components/discovery/surfaces';
import GrowthActionStack from '@/components/discovery/surfaces/GrowthActionStack';
import { useHomeSurfacePlan } from '@/components/feed/GeoFeed';
import CreatorMomentumCard from '@/components/home/CreatorMomentumCard';
import ReturnBelongingStrip from '@/components/home/ReturnBelongingStrip';
import HomeProfileProgressCard from '@/components/home/HomeProfileProgressCard';
import HomeRecommendedPromotions from '@/components/home/HomeRecommendedPromotions';
import UserActionCenter from '@/components/home/UserActionCenter';

type Props = {
  welcomeLine?: string | null;
};

/**
 * Desktop right column — personal community cockpit (Phase 7F).
 * Order: Welcome → Reputation → HCP/Growth progress → Community pulse → Tips →
 * Growth tasks → Activity modules → Promotions.
 */
export default function HomeDesktopSidebar({ welcomeLine }: Props) {
  const { t } = useTranslation();
  const surfacePlan = useHomeSurfacePlan();
  const { data: session } = useSession();
  const {
    handleGuestReputationClick,
    guestBottomNavPanelEl,
  } = useGuestBottomNavPanel();

  return (
    <>
      <div className="flex flex-col gap-3 pb-3" data-home-sidebar="community-cockpit">
        {session?.user && welcomeLine ? (
          <div className="hc-dorpsplein-card hc-dorpsplein-card-warm px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 leading-snug">{welcomeLine}</p>
            <p className="mt-1 text-xs text-gray-600">{t('homeDorpsplein.sidebarTagline')}</p>
          </div>
        ) : null}

        <HomeReputationCompactCard
          variant="sidebar"
          onGuestClick={handleGuestReputationClick}
        />

        {session?.user ? <GrowthActionStack plan={surfacePlan} /> : null}

        <CommunityPulseBar variant="sidebar" />

        <div className="hc-dorpsplein-card hc-dorpsplein-card-community px-4 py-4">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary-brand mt-0.5" aria-hidden />
            <h3 className="text-sm font-semibold text-gray-900">
              {t('homeDorpsplein.communityCardTitle')}
            </h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            {t('homeDorpsplein.communityCardBody')}
          </p>
          <Link
            href="/faq"
            className="inline-flex text-xs font-semibold text-secondary-brand hover:text-secondary-700"
          >
            {t('homeDorpsplein.communityCardCta')} →
          </Link>
        </div>

        {session?.user ? (
          <>
            <CreatorMomentumCard className="mb-0" />
            <UserActionCenter variant="sidebar" />
            <ReturnBelongingStrip className="mb-0" />
            <HomeProfileProgressCard className="mb-0" />
            <DesktopRightSidebarSurfaceStack
              plan={surfacePlan}
              mode="activity-modules"
            />
          </>
        ) : null}

        <HomeRecommendedPromotions variant="sidebar" />
      </div>
      {guestBottomNavPanelEl}
    </>
  );
}
