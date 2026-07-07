'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type CourierJob = {
  status?: string | null;
  needsAccept?: boolean | null;
  deliveryDate?: string | null;
  activeAssignment?: { status?: string | null } | null;
};

type CourierRequests = {
  available: unknown[];
  mine: CourierJob[];
};

function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * CE-2A.8 / CE-2B.5 — courier perspective inside the agreements hub. Surfaces the
 * courier's own jobs by state (today / awaiting acceptance / en route) plus nearby
 * availability, and links to the full delivery dashboard (no second dashboard).
 * Renders nothing for non-couriers (403) or on error.
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

  const mine = useMemo(() => data?.mine ?? [], [data]);
  const availableCount = data?.available?.length ?? 0;

  const stateCounts = useMemo(() => {
    let today = 0;
    let awaitingAccept = 0;
    let enRoute = 0;
    for (const job of mine) {
      if (job.needsAccept || job.activeAssignment?.status === 'PENDING') {
        awaitingAccept += 1;
      } else if (job.status === 'ASSIGNED' || job.activeAssignment?.status === 'ACCEPTED') {
        enRoute += 1;
      }
      if (isToday(job.deliveryDate)) today += 1;
    }
    return { today, awaitingAccept, enRoute };
  }, [mine]);

  const mineCount = mine.length;
  if (!data || (mineCount === 0 && availableCount === 0)) return null;

  const parts: string[] = [];
  if (stateCounts.today > 0) {
    parts.push(t('marketplace.agreements.courier.today', { count: stateCounts.today }));
  }
  if (stateCounts.awaitingAccept > 0) {
    parts.push(
      t('marketplace.agreements.courier.awaitingAccept', {
        count: stateCounts.awaitingAccept,
      }),
    );
  }
  if (stateCounts.enRoute > 0) {
    parts.push(t('marketplace.agreements.courier.enRoute', { count: stateCounts.enRoute }));
  }
  if (parts.length === 0) {
    parts.push(
      mineCount > 0
        ? t('marketplace.agreements.courier.mine', { count: mineCount })
        : t('marketplace.agreements.courier.available', { count: availableCount }),
    );
  }

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
          {parts.join(' \u00b7 ')}
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-sky-800 underline">
        {t('marketplace.agreements.courier.dashboard')}
      </span>
    </Link>
  );
}
