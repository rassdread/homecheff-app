'use client';

import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestBottomNavPanel } from '@/hooks/useGuestBottomNavPanel';
import CommunityPulseBar from '@/components/home/CommunityPulseBar';
import HomeReputationCompactCard from '@/components/home/HomeReputationCompactCard';
import HomeVerticalChipStrip from '@/components/home/HomeVerticalChipStrip';
import HomeRecommendedPromotions from '@/components/home/HomeRecommendedPromotions';
import { parsePromoInsertId, type HomeMobileFeedInsertId } from '@/lib/home/resolve-home-mobile-insert';

export type { HomeMobileFeedInsertId } from '@/lib/home/resolve-home-mobile-insert';
export { resolveHomeMobileInsert } from '@/lib/home/resolve-home-mobile-insert';

export function HomeMobileFeedInsert({
  insertId,
}: {
  insertId: HomeMobileFeedInsertId;
}) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { openCreateFlow } = useCreateFlow();
  const { handleGuestCreateClick, guestBottomNavPanelEl } =
    useGuestBottomNavPanel();

  if (insertId === 'verticals') {
    return (
      <div className="col-span-2 w-full my-1">
        <HomeVerticalChipStrip />
      </div>
    );
  }

  if (insertId === 'pulse') {
    return (
      <div className="col-span-2 w-full my-1">
        <CommunityPulseBar variant="insertCompact" />
      </div>
    );
  }

  if (insertId === 'reputation' && session?.user) {
    return (
      <div className="col-span-2 w-full my-1">
        <HomeReputationCompactCard variant="sidebar" />
      </div>
    );
  }

  if (insertId === 'share') {
    return (
      <div className="col-span-2 w-full my-1">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-white px-3 py-2">
          <p className="min-w-0 text-xs font-medium text-gray-800 truncate">
            {t('homeDorpsplein.mobileShareInsertTitle')}
          </p>
          {session?.user ? (
            <button
              type="button"
              onClick={() => openCreateFlow()}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-brand px-2.5 py-1.5 text-[11px] font-semibold text-white touch-manipulation"
            >
              <Plus className="h-3 w-3" aria-hidden />
              {t('homePhase1.ctaShare')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGuestCreateClick}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-brand px-2.5 py-1.5 text-[11px] font-semibold text-white touch-manipulation"
            >
              <Plus className="h-3 w-3" aria-hidden />
              {t('homePhase1.ctaShare')}
            </button>
          )}
        </div>
        {guestBottomNavPanelEl}
      </div>
    );
  }

  const promoId = parsePromoInsertId(insertId);
  if (promoId) {
    return (
      <div className="col-span-2 w-full my-1">
        <HomeRecommendedPromotions variant="feedInsert" promotionId={promoId} />
      </div>
    );
  }

  return null;
}

export default HomeMobileFeedInsert;
