'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

type ReturnSignal = {
  key: 'followedCreatorsPosted' | 'yourAudienceGrowing' | 'communitySavesActive';
  meta?: { savesWeek?: number };
};

export default function ReturnBelongingStrip() {
  const { t } = useTranslation();
  const [signals, setSignals] = useState<ReturnSignal[]>([]);
  const tracked = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/return-signals', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { signals?: ReturnSignal[] };
        const next = Array.isArray(json.signals) ? json.signals.slice(0, 2) : [];
        if (cancelled) return;
        setSignals(next);
        if (!tracked.current && next.length > 0) {
          tracked.current = true;
          trackOnboardingEvent('RETURN_BELONGING_STRIP_SHOWN', {
            keys: next.map((s) => s.key),
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (signals.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-slate-200/90 bg-slate-50/85 px-4 py-3 text-sm text-slate-700 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t('returnBelonging.title')}
      </p>
      <ul className="mt-2 space-y-1.5">
        {signals.map((s) => (
          <li key={s.key} className="leading-snug text-slate-700">
            {s.key === 'communitySavesActive' && typeof s.meta?.savesWeek === 'number'
              ? t('returnBelonging.communitySavesActive', { count: s.meta.savesWeek })
              : t(`returnBelonging.${s.key}` as const)}
          </li>
        ))}
      </ul>
    </div>
  );
}
