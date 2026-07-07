'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type CourierRequests = {
  available: unknown[];
  mine: unknown[];
};

/**
 * CE-2A.8 — light courier perspective inside the agreements hub. Shows the
 * courier's own active jobs + nearby availability and links to the full
 * delivery dashboard. Renders nothing for non-couriers (403) or on error.
 */
export default function CourierAgreementsStrip() {
  const { t } = useTranslation();
  const [data, setData] = useState<CourierRequests | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/delivery/community-requests');
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as CourierRequests;
        if (cancelled) return;
        setData(json);
      } catch {
        /* not a courier / offline — strip stays hidden */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mineCount = data?.mine?.length ?? 0;
  const availableCount = data?.available?.length ?? 0;
  if (!data || (mineCount === 0 && availableCount === 0)) return null;

  return (
    <Link
      href="/delivery/dashboard"
      className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
    >
      <span className="inline-flex shrink-0 rounded-lg bg-sky-100 p-2 text-sky-700">
        <Truck className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-sky-950">
          {t('marketplace.agreements.courier.heading')}
        </span>
        <span className="block text-xs text-sky-900">
          {mineCount > 0
            ? t('marketplace.agreements.courier.mine', { count: mineCount })
            : t('marketplace.agreements.courier.available', {
                count: availableCount,
              })}
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-sky-800 underline">
        {t('marketplace.agreements.courier.dashboard')}
      </span>
    </Link>
  );
}
