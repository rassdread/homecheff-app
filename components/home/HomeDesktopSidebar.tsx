'use client';

import Link from 'next/link';
import { MessageCircle, Plus, Users, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import { useGuestBottomNavPanel } from '@/hooks/useGuestBottomNavPanel';
import HomeReputationCompactCard from '@/components/home/HomeReputationCompactCard';
import CommunityPulseBar from '@/components/home/CommunityPulseBar';
import CreatorMomentumCard from '@/components/home/CreatorMomentumCard';
import ReturnBelongingStrip from '@/components/home/ReturnBelongingStrip';
import HomeProfileProgressCard from '@/components/home/HomeProfileProgressCard';

type Props = {
  welcomeLine?: string | null;
};

const quickActionClass =
  'flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 hover:border-secondary-brand/30 hover:bg-secondary-50/40 transition-colors text-left w-full';

export default function HomeDesktopSidebar({ welcomeLine }: Props) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { openCreateFlow } = useCreateFlow();
  const { requireAuthAction, guestAuthPanel } = useGuestAuthGate();
  const { sessionStatus, handleGuestMessagesClick, guestBottomNavPanelEl } =
    useGuestBottomNavPanel();

  const messagesTabUseLink = sessionStatus !== 'unauthenticated';

  return (
    <>
      <div className="flex flex-col gap-3 pb-3">
        {session?.user && welcomeLine ? (
          <div className="hc-dorpsplein-card hc-dorpsplein-card-warm px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 leading-snug">{welcomeLine}</p>
            <p className="mt-1 text-xs text-gray-600">{t('homeDorpsplein.sidebarTagline')}</p>
          </div>
        ) : null}

        {session?.user ? <HomeReputationCompactCard variant="sidebar" /> : null}

        <CommunityPulseBar variant="sidebar" />

        <div className="hc-dorpsplein-card px-4 py-3">
          <h3 className="hc-section-title text-base mb-3">
            {t('homeDorpsplein.quickActionsTitle')}
          </h3>
          <div className="grid gap-2">
            {session?.user ? (
              <button
                type="button"
                onClick={() => openCreateFlow()}
                className="flex items-center gap-3 rounded-xl bg-primary-brand px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors text-left"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {t('homePhase1.ctaShare')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => requireAuthAction('create', '/sell/new')}
                className="flex items-center gap-3 rounded-xl bg-primary-brand px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors text-left"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {t('homePhase1.ctaShare')}
              </button>
            )}
            {messagesTabUseLink ? (
              <Link href="/messages" className={quickActionClass}>
                <MessageCircle className="h-4 w-4 shrink-0 text-secondary-brand" aria-hidden />
                {t('bottomNav.messages')}
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleGuestMessagesClick}
                className={quickActionClass}
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-secondary-brand" aria-hidden />
                {t('bottomNav.messages')}
              </button>
            )}
            <Link
              href="/?chip=sale#homecheff-feed"
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 hover:border-primary-brand/30 hover:bg-primary-50/50 transition-colors"
            >
              <Users className="h-4 w-4 shrink-0 text-primary-brand" aria-hidden />
              {t('homeDorpsplein.browseMakers')}
            </Link>
          </div>
        </div>

        {session?.user ? (
          <>
            <CreatorMomentumCard className="mb-0" />
            <ReturnBelongingStrip className="mb-0" />
            <HomeProfileProgressCard className="mb-0" />
          </>
        ) : null}

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

        <div
          className="hc-dorpsplein-card border-dashed border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 px-4 py-4 opacity-90"
          aria-hidden
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800/70 mb-1">
            {t('homeDorpsplein.spotlightLabel')}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t('homeDorpsplein.spotlightPlaceholder')}
          </p>
        </div>
      </div>
      {guestAuthPanel}
      {guestBottomNavPanelEl}
    </>
  );
}
