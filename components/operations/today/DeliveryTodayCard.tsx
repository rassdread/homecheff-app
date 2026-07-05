'use client';

import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
  Truck,
} from 'lucide-react';
import type { DeliveryDashboardSnapshot } from '@/lib/operations/operations-today-helpers';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import { cn } from '@/lib/utils';

type Props = {
  data: DeliveryDashboardSnapshot | null;
  expanded: boolean;
  onToggle: () => void;
  loading?: boolean;
  /** Compact Uber-style bar for above-the-fold */
  variant?: 'card' | 'active-bar';
};

export default function DeliveryTodayCard({
  data,
  expanded,
  onToggle,
  loading = false,
  variant = 'card',
}: Props) {
  const { tOr, language } = useTranslation();

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  const title = tOr('operations.tabs.delivery', 'Delivery', 'Bezorgen');
  const cta = tOr(
    'operations.today.delivery.cta',
    'Go to delivery',
    'Ga naar bezorgen',
  );
  const activeLabel = tOr(
    'operations.today.delivery.active',
    'Active delivery',
    'Actieve bezorging',
  );
  const availableLabel = tOr(
    'operations.today.delivery.available',
    'Available orders',
    'Beschikbare opdrachten',
  );
  const todayLabel = tOr(
    'operations.today.delivery.todayEarnings',
    'Earnings today',
    'Verdiensten vandaag',
  );
  const statusLabel = tOr(
    'operations.today.delivery.status',
    'Status',
    'Status',
  );

  const hasActive = Boolean(data?.currentOrder);
  const isOnline = data?.isOnline ?? false;

  if (loading && variant === 'active-bar') {
    return (
      <div className="animate-pulse rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="h-4 w-40 rounded bg-blue-100" />
      </div>
    );
  }

  if (variant === 'active-bar' && hasActive && data?.currentOrder) {
    const order = data.currentOrder;
    return (
      <Link
        href={OPERATIONS_ROUTES.delivery.home}
        prefetch
        className="block rounded-2xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition hover:border-blue-400"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Navigation className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              {activeLabel}
            </p>
            <p className="mt-0.5 font-semibold text-gray-900 truncate">
              {order.product?.title ?? 'Bezorging'}
            </p>
            <p className="text-sm text-gray-600 truncate">
              {order.customerName ?? order.status}
            </p>
          </div>
          <span className="shrink-0 text-sm font-bold text-blue-700">→</span>
        </div>
      </Link>
    );
  }

  if (loading) {
    return (
      <article className="hc-dorpsplein-card animate-pulse p-4">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="mt-3 h-16 rounded-lg bg-gray-100" />
      </article>
    );
  }

  if (!data) return null;

  return (
    <article
      className={cn(
        'hc-dorpsplein-card overflow-hidden',
        hasActive && 'ring-2 ring-blue-200',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-700" aria-hidden />
          <span className="font-semibold text-gray-900">{title}</span>
          {hasActive ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
              {activeLabel}
            </span>
          ) : null}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded ? (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          {hasActive && data.currentOrder ? (
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3">
              <p className="text-xs font-semibold text-blue-800">{activeLabel}</p>
              <p className="mt-1 font-medium text-gray-900">
                {data.currentOrder.product?.title}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {data.currentOrder.customerName}
              </p>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500">{statusLabel}</dt>
              <dd className="font-semibold text-gray-900">
                {isOnline ? 'Online' : 'Offline'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{availableLabel}</dt>
              <dd className="font-semibold text-gray-900">
                {data.stats.availableOrders}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-gray-500">{todayLabel}</dt>
              <dd className="font-semibold text-emerald-800">
                {formatCurrency(data.stats.todayEarnings)}
              </dd>
            </div>
          </dl>

          <Link
            href={OPERATIONS_ROUTES.delivery.home}
            prefetch
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {cta}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
