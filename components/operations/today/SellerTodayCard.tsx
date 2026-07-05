'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp, Package, Truck } from 'lucide-react';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import type { SellerTodaySnapshot } from '@/hooks/useOperationsTodayRoleData';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import {
  parseBlockedProductsCount,
  parsePendingOrdersCount,
} from '@/lib/operations/operations-today-helpers';
import { cn } from '@/lib/utils';

type Props = {
  data: SellerTodaySnapshot | null;
  expanded: boolean;
  onToggle: () => void;
  loading?: boolean;
};

export default function SellerTodayCard({
  data,
  expanded,
  onToggle,
  loading = false,
}: Props) {
  const { tOr, language } = useTranslation();
  const { actionCenter } = useOperationsSidepanel();

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  const title = tOr('operations.tabs.orders', 'Orders', 'Bestellingen');
  const cta = tOr(
    'operations.today.seller.cta',
    'Open orders',
    'Bestellingen openen',
  );
  const pendingLabel = tOr(
    'operations.today.seller.pending',
    'Pending',
    'Wachtend',
  );
  const revenueLabel = tOr(
    'operations.today.seller.revenue7d',
    'Revenue 7 days',
    'Omzet 7 dagen',
  );
  const blockedLabel = tOr(
    'operations.today.seller.blocked',
    'Blocked products',
    'Geblokkeerde producten',
  );

  const items = actionCenter?.items ?? [];
  const pendingCount = parsePendingOrdersCount(items);
  const blockedCount = parseBlockedProductsCount(items);

  if (loading) {
    return (
      <article className="hc-dorpsplein-card animate-pulse p-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-3 h-16 rounded-lg bg-gray-100" />
      </article>
    );
  }

  if (!data && pendingCount === 0 && blockedCount === 0) {
    return (
      <article className="hc-dorpsplein-card overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-700" aria-hidden />
            <span className="font-semibold text-gray-900">{title}</span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {expanded ? (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3">
            <Link
              href={OPERATIONS_ROUTES.seller.orders}
              prefetch
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {cta}
            </Link>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className="hc-dorpsplein-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-emerald-700" aria-hidden />
          <span className="font-semibold text-gray-900">{title}</span>
          {pendingCount > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
              {pendingCount}
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
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500">{pendingLabel}</dt>
              <dd className="font-semibold text-gray-900">{pendingCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{revenueLabel}</dt>
              <dd className="font-semibold text-gray-900">
                {formatCurrency(data?.revenue7d ?? 0)}
              </dd>
            </div>
            {blockedCount > 0 ? (
              <div className="col-span-2">
                <dt className="text-xs text-gray-500">{blockedLabel}</dt>
                <dd className="font-semibold text-red-700">{blockedCount}</dd>
              </div>
            ) : null}
          </dl>

          {data?.recentOrders && data.recentOrders.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {data.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-xs"
                >
                  <p className="font-semibold text-gray-900 truncate">
                    #{order.orderNumber} · {order.productTitle}
                  </p>
                  <p className="text-gray-600">
                    {order.customerName} · {formatCurrency(order.amount)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          <Link
            href={OPERATIONS_ROUTES.seller.orders}
            prefetch
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {cta}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
