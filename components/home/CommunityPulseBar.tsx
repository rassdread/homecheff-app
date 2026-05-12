'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

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

const MAX_CHIPS = 6;

export default function CommunityPulseBar() {
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

  const chips = buildChips(data, t);

  useEffect(() => {
    if (!data || trackedRef.current) return;
    trackedRef.current = true;
    trackOnboardingEvent('COMMUNITY_MOMENTUM_LOADED', {
      savesWeek: data.savesWeek ?? 0,
      followsWeek: data.followsWeek ?? 0,
      discussionWeek: (data.commentsWeek ?? 0) + (data.reviewsWeek ?? 0),
    });
  }, [data]);

  if (loading) {
    return (
      <div
        className="mb-4 rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-sm"
        aria-busy="true"
        aria-label={language === 'en' ? 'Loading community snapshot' : 'Community-moment laden'}
      >
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200/90" />
        <div className="mt-2 flex gap-2">
          <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="h-7 w-32 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (chips.length === 0) {
    return (
      <div className="mb-4 flex items-start gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2.5 text-sm text-slate-700 shadow-sm backdrop-blur-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        <p className="leading-snug">{t('communityPulse.fallbackLine')}</p>
      </div>
    );
  }

  return (
    <div
      className="mb-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/95 to-teal-50/80 px-3 py-2.5 shadow-sm backdrop-blur-sm"
      aria-label={language === 'en' ? 'Community activity' : 'Community-activiteit'}
    >
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-900/80">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {t('communityPulse.heading')}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((c) => (
          <span
            key={c.key}
            className="shrink-0 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm"
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function buildChips(
  data: CommunityPulsePayload | null,
  t: (key: string, params?: Record<string, string | number>) => string,
): { key: string; label: string }[] {
  if (!data) return [];
  const out: { key: string; label: string }[] = [];

  const push = (key: string, label: string) => {
    if (out.length >= MAX_CHIPS) return;
    out.push({ key, label });
  };

  if (data.newProducts24h > 0) {
    push('newProducts', t('communityPulse.newProducts24h', { count: data.newProducts24h }));
  }
  if (data.newMembers7d > 0) {
    push('newCreators', t('communityPulse.newCreators7d', { count: data.newMembers7d }));
  }
  if ((data.savesWeek ?? 0) > 0) {
    push('savesWeek', t('communityPulse.savesWeek', { count: data.savesWeek ?? 0 }));
  }
  if ((data.followsWeek ?? 0) > 0) {
    push('followsWeek', t('communityPulse.followsWeek', { count: data.followsWeek ?? 0 }));
  }
  if (data.newRecipes7d > 0) {
    push('newInspiration', t('communityPulse.newInspiration7d', { count: data.newRecipes7d }));
  }
  const discussion = (data.commentsWeek ?? 0) + (data.reviewsWeek ?? 0);
  if (discussion > 0) {
    push('discussion', t('communityPulse.discussionWeek', { count: discussion }));
  }
  if (
    data.mostSavedProductTitle &&
    (data.mostSavedProductCount ?? 0) >= 2
  ) {
    push(
      'mostSaved',
      t('communityPulse.mostSavedThisWeek', {
        title: data.mostSavedProductTitle,
        count: data.mostSavedProductCount ?? 0,
      }),
    );
  }
  if (
    data.risingSellerUsername &&
    (data.risingSellerListings ?? 0) >= 2
  ) {
    push(
      'rising',
      t('communityPulse.risingCreatorWeek', {
        name: data.risingSellerUsername,
        count: data.risingSellerListings ?? 0,
      }),
    );
  }
  if ((data.listingCreatorsWeek ?? 0) > 0) {
    push(
      'activeListers',
      t('communityPulse.activeListersWeek', { count: data.listingCreatorsWeek ?? 0 }),
    );
  }
  if (data.topHcpUsername && (data.topHcpTotal ?? 0) > 0) {
    push(
      'hcp',
      t('communityPulse.topHcpSpotlight', {
        name: data.topHcpUsername,
        points: data.topHcpTotal ?? 0,
      }),
    );
  }

  return out.slice(0, MAX_CHIPS);
}
