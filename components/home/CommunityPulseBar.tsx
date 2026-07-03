'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';
import { cn } from '@/lib/utils';

export type CommunityPulsePayload = {
  newProducts24h: number;
  newMembers7d: number;
  newRecipes7d: number;
  topHcpUsername: string | null;
  topHcpTotal: number | null;
  followsWeek?: number;
  savesWeek?: number;
  commentsWeek?: number;
  reviewsWeek?: number;
  listingCreatorsWeek?: number;
  mostSavedProductTitle?: string | null;
  mostSavedProductCount?: number;
  risingSellerUsername?: string | null;
  risingSellerListings?: number;
};

type PulseMoment = { key: string; label: string; emoji: string };

const MAX_MOMENTS = 4;

const CHIP_EMOJI: Record<string, string> = {
  newProducts: '🍲',
  newCreators: '👋',
  savesWeek: '❤️',
  followsWeek: '✨',
  newInspiration: '💡',
  discussion: '💬',
  mostSaved: '⭐',
  rising: '🌱',
  activeListers: '🏪',
  hcp: '🤝',
};

export default function CommunityPulseBar({
  variant = 'default',
}: {
  variant?: 'default' | 'sidebar' | 'insert' | 'insertCompact';
}) {
  const { t, language } = useTranslation();
  const [data, setData] = useState<CommunityPulsePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const trackedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/home/community-pulse', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as CommunityPulsePayload;
        if (!cancelled) setData(j);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const moments = buildMoments(data, t);

  useEffect(() => {
    if (!data || trackedRef.current) return;
    trackedRef.current = true;
    trackOnboardingEvent('COMMUNITY_MOMENTUM_LOADED', {
      savesWeek: data.savesWeek ?? 0,
      followsWeek: data.followsWeek ?? 0,
      discussionWeek: (data.commentsWeek ?? 0) + (data.reviewsWeek ?? 0),
    });
  }, [data]);

  const containerBase =
    variant === 'sidebar'
      ? 'hc-dorpsplein-card px-4 py-3.5 mb-0'
      : variant === 'insertCompact'
        ? 'rounded-xl border border-gray-200/70 bg-white/90 px-2 py-1.5 mb-0'
        : variant === 'insert'
          ? 'rounded-2xl border border-gray-200/80 bg-gradient-to-br from-[#faf8f4] via-white to-primary-50/20 px-4 py-3 mb-0 shadow-sm'
          : 'mb-4 rounded-2xl border border-gray-200/70 bg-gradient-to-br from-[#faf8f4] via-white to-secondary-50/20 px-4 py-3.5 shadow-sm';

  if (loading) {
    return (
      <div
        className={containerBase}
        aria-busy="true"
        aria-label={language === 'en' ? 'Loading neighborhood moments' : 'Buurtmomenten laden'}
      >
        <div className="h-4 w-36 animate-pulse rounded bg-gray-200/80 mb-3" />
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (moments.length === 0) {
    return (
      <div className={cn(containerBase, 'flex items-start gap-3')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg" aria-hidden>
          ✨
        </span>
        <p className="text-sm text-gray-700 leading-relaxed pt-1">{t('communityPulse.fallbackLine')}</p>
      </div>
    );
  }

  if (variant === 'insertCompact') {
    const top = moments[0];
    if (!top) {
      return (
        <p className={cn(containerBase, 'text-[11px] text-gray-600 truncate')}>
          {t('communityPulse.fallbackLine')}
        </p>
      );
    }
    return (
      <p className={cn(containerBase, 'flex items-center gap-1.5 text-[11px] text-gray-800 truncate')}>
        <span aria-hidden>{top.emoji}</span>
        <span className="truncate font-medium">{top.label}</span>
      </p>
    );
  }

  const showHorizontal = variant === 'default' && moments.length > 0;

  return (
    <div
      className={containerBase}
      aria-label={language === 'en' ? 'Neighborhood moments' : 'Buurtmomenten'}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-brand/10 text-primary-brand">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary-brand">
            {t('homeDorpsplein.buurtmomentenTitle')}
          </p>
          <p className="text-[11px] text-gray-500">{t('communityPulse.heading')}</p>
        </div>
      </div>

      {showHorizontal ? (
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {moments.map((m) => (
            <MomentRow key={m.key} moment={m} compact />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {moments.slice(0, variant === 'sidebar' ? 3 : MAX_MOMENTS).map((m) => (
            <li key={m.key}>
              <MomentRow moment={m} />
            </li>
          ))}
        </ul>
      )}

      {variant === 'sidebar' && moments.length > 0 ? (
        <Link
          href="/?chip=all#homecheff-feed"
          className="mt-3 inline-block text-[11px] font-semibold text-secondary-brand hover:text-secondary-700 transition-colors"
        >
          {t('homeDorpsplein.viewAllActivity')} →
        </Link>
      ) : null}
    </div>
  );
}

function MomentRow({ moment, compact }: { moment: PulseMoment; compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white/90 shadow-sm',
        compact ? 'shrink-0 px-3 py-2 min-w-[200px]' : 'px-3 py-2.5 w-full hc-card-lift'
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 text-lg shadow-inner"
        aria-hidden
      >
        {moment.emoji}
      </span>
      <p className="text-xs sm:text-sm text-gray-800 leading-snug font-medium line-clamp-2">
        {moment.label}
      </p>
    </div>
  );
}

function buildMoments(
  data: CommunityPulsePayload | null,
  t: (key: string, params?: Record<string, string | number>) => string,
): PulseMoment[] {
  if (!data) return [];
  const out: PulseMoment[] = [];

  const push = (key: string, label: string) => {
    if (out.length >= MAX_MOMENTS) return;
    out.push({ key, label, emoji: CHIP_EMOJI[key] ?? '✨' });
  };

  if (data.risingSellerUsername && (data.risingSellerListings ?? 0) >= 1) {
    push(
      'rising',
      t('communityPulse.risingCreatorWeek', {
        name: data.risingSellerUsername,
        count: data.risingSellerListings ?? 0,
      })
    );
  }
  if (data.newProducts24h > 0) {
    push('newProducts', t('communityPulse.newProducts24h', { count: data.newProducts24h }));
  }
  if (data.newRecipes7d > 0) {
    push('newInspiration', t('communityPulse.newInspiration7d', { count: data.newRecipes7d }));
  }
  if ((data.savesWeek ?? 0) > 0) {
    push('savesWeek', t('communityPulse.savesWeek', { count: data.savesWeek ?? 0 }));
  }
  if (data.newMembers7d > 0) {
    push('newCreators', t('communityPulse.newCreators7d', { count: data.newMembers7d }));
  }
  if ((data.followsWeek ?? 0) > 0) {
    push('followsWeek', t('communityPulse.followsWeek', { count: data.followsWeek ?? 0 }));
  }
  const discussion = (data.commentsWeek ?? 0) + (data.reviewsWeek ?? 0);
  if (discussion > 0) {
    push('discussion', t('communityPulse.discussionWeek', { count: discussion }));
  }
  if (data.mostSavedProductTitle && (data.mostSavedProductCount ?? 0) >= 2) {
    push(
      'mostSaved',
      t('communityPulse.mostSavedThisWeek', {
        title: data.mostSavedProductTitle,
        count: data.mostSavedProductCount ?? 0,
      })
    );
  }
  if ((data.listingCreatorsWeek ?? 0) > 0) {
    push(
      'activeListers',
      t('communityPulse.activeListersWeek', { count: data.listingCreatorsWeek ?? 0 })
    );
  }
  if (data.topHcpUsername) {
    push(
      'hcp',
      t('communityPulse.topHcpSpotlight', {
        name: data.topHcpUsername,
        points: data.topHcpTotal ?? 0,
      })
    );
  }

  return out.slice(0, MAX_MOMENTS);
}
