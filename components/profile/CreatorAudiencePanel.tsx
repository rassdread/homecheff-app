'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Users, Heart, Bookmark, RefreshCw, MapPin, Sparkles } from 'lucide-react';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

type AudienceHints = Array<'growing' | 'discovery' | 'returning' | 'breadth'>;

type AudiencePayload = {
  hasSellerProfile: boolean;
  place: string | null;
  profileViews: number;
  totalFollowers: number;
  newFollowersWeek: number;
  productSavesWeek: number;
  distinctSaversWeek: number;
  recurringSupportersMonth: number;
  activeProductListings: number;
  hints: AudienceHints;
  generatedAt: string;
};

export default function CreatorAudiencePanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<AudiencePayload | null>(null);
  const [error, setError] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/creator/audience-insights', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const json = (await res.json()) as AudiencePayload;
        if (cancelled) return;
        setData(json);
        if (!tracked.current && json.hasSellerProfile) {
          tracked.current = true;
          trackOnboardingEvent('CREATOR_AUDIENCE_INSIGHTS_VIEWED', {
            hints: json.hints?.length ?? 0,
          });
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error || !data) return null;
  if (!data.hasSellerProfile) return null;

  const hintLines = (data.hints ?? []).map((h) => t(`creatorAudience.hints.${h}` as const));

  return (
    <section
      className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/40 to-slate-50/80 p-4 shadow-sm sm:p-5"
      aria-label={t('creatorAudience.sectionAria')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-900">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <h3 className="text-base font-semibold tracking-tight">{t('creatorAudience.title')}</h3>
          </div>
          <p className="mt-1 max-w-prose text-sm text-slate-600">{t('creatorAudience.subtitle')}</p>
        </div>
        {data.place ? (
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{t('creatorAudience.localPresence', { place: data.place })}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {t('creatorAudience.metrics.followers')}
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{data.totalFollowers}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('creatorAudience.metrics.newFollowersWeek', { count: data.newFollowersWeek })}
          </p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Bookmark className="h-3.5 w-3.5" aria-hidden />
            {t('creatorAudience.metrics.savesWeek')}
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{data.productSavesWeek}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('creatorAudience.metrics.distinctSaversWeek', { count: data.distinctSaversWeek })}
          </p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {t('creatorAudience.metrics.recurring')}
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {data.recurringSupportersMonth}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{t('creatorAudience.metrics.recurringHint')}</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm sm:col-span-1">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Heart className="h-3.5 w-3.5" aria-hidden />
            {t('creatorAudience.metrics.profileViews')}
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{data.profileViews}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('creatorAudience.metrics.listingsActive', { count: data.activeProductListings })}
          </p>
        </div>
      </div>

      {hintLines.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-emerald-100/80 pt-4 text-sm text-slate-700">
          {hintLines.map((line, i) => (
            <li key={`${line}-${i}`} className="flex gap-2 leading-snug">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/80" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-emerald-100/80 pt-4 text-sm text-slate-600">
          {t('creatorAudience.calmDefault')}
        </p>
      )}
    </section>
  );
}
