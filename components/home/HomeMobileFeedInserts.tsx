'use client';

import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import CommunityPulseBar from '@/components/home/CommunityPulseBar';
import HomeReputationCompactCard from '@/components/home/HomeReputationCompactCard';
import type { HomeMobileFeedInsertId } from '@/lib/home/resolve-home-mobile-insert';

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
  const { requireAuthAction, guestAuthPanel } = useGuestAuthGate();

  if (insertId === 'pulse') {
    return (
      <div className="col-span-2 w-full my-1">
        <CommunityPulseBar variant="insert" />
      </div>
    );
  }

  if (insertId === 'reputation' && session?.user) {
    return (
      <div className="col-span-2 w-full my-1">
        <HomeReputationCompactCard variant="insert" />
      </div>
    );
  }

  if (insertId === 'share') {
    return (
      <div className="col-span-2 w-full my-1">
        <div className="hc-dorpsplein-card hc-dorpsplein-card-warm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {t('homeDorpsplein.mobileShareInsertTitle')}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('homeDorpsplein.mobileShareInsertBody')}
            </p>
          </div>
          {session?.user ? (
            <button
              type="button"
              onClick={() => openCreateFlow()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-brand px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t('homePhase1.ctaShare')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => requireAuthAction('create', '/sell/new')}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-brand px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t('homePhase1.ctaShare')}
            </button>
          )}
        </div>
        {guestAuthPanel}
      </div>
    );
  }

  return null;
}

export default HomeMobileFeedInsert;
