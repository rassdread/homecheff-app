'use client';

import Link from 'next/link';
import {
  Package,
  Store,
  Users,
  Truck,
  TrendingUp,
  Settings,
  ChevronRight,
  Coins,
} from 'lucide-react';
import type { MyHomeCheffCardDef } from '@/lib/navigation/my-homecheff-hub';
import type { MyHomeCheffHubMetrics } from '@/hooks/useMyHomeCheffHubData';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

const CARD_ICONS = {
  orders: Package,
  hc: Coins,
  seller: Store,
  affiliate: Users,
  delivery: Truck,
  earnings: TrendingUp,
  account: Settings,
} as const;

type Props = {
  card: MyHomeCheffCardDef;
  metrics: MyHomeCheffHubMetrics;
  loading?: boolean;
  referralLink?: string | null;
};

function formatEuro(cents: number | null | undefined): string | null {
  if (cents == null || !Number.isFinite(cents)) return null;
  return `€${(cents / 100).toFixed(2)}`;
}

function formatEuroFromUnits(amount: number | null | undefined): string | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  return `€${amount.toFixed(2)}`;
}

export default function MyHomeCheffHubCard({
  card,
  metrics,
  loading = false,
  referralLink,
}: Props) {
  const { t } = useTranslation();
  const Icon = CARD_ICONS[card.id];

  const statLines: string[] = [];

  if (card.id === 'orders' && metrics.buyerOrderCount != null) {
    statLines.push(
      t('myHomeCheffHub.metrics.orderCount', { count: metrics.buyerOrderCount }),
    );
  }
  if (card.id === 'seller') {
    if (metrics.sellerNewOrders != null && metrics.sellerNewOrders > 0) {
      statLines.push(
        t('myHomeCheffHub.metrics.sellerOrders', { count: metrics.sellerNewOrders }),
      );
    }
    const rev = formatEuroFromUnits(metrics.sellerRevenue7d);
    if (rev) statLines.push(t('myHomeCheffHub.metrics.sellerRevenue', { amount: rev }));
  }
  if (card.id === 'affiliate') {
    const earned = formatEuro(metrics.affiliateEarnedCents);
    if (earned) statLines.push(t('myHomeCheffHub.metrics.affiliateEarned', { amount: earned }));
    if (metrics.affiliateReferrals != null && metrics.affiliateReferrals > 0) {
      statLines.push(
        t('myHomeCheffHub.metrics.affiliateReferrals', {
          count: metrics.affiliateReferrals,
        }),
      );
    }
  }
  if (card.id === 'delivery') {
    if (metrics.deliveryActiveJobs != null && metrics.deliveryActiveJobs > 0) {
      statLines.push(
        t('myHomeCheffHub.metrics.deliveryJobs', { count: metrics.deliveryActiveJobs }),
      );
    }
    const today = formatEuroFromUnits(metrics.deliveryEarningsToday);
    if (today) statLines.push(t('myHomeCheffHub.metrics.deliveryEarnings', { amount: today }));
  }
  if (card.id === 'earnings') {
    const total = formatEuro(metrics.totalEarningsCents);
    if (total) statLines.push(t('myHomeCheffHub.metrics.totalEarnings', { amount: total }));
  }

  const showEmpty =
    card.mode === 'active' &&
    card.emptyKey &&
    statLines.length === 0 &&
    !loading &&
    card.id !== 'account';

  const secondaryHref =
    card.id === 'affiliate' && referralLink && card.secondaryHref
      ? card.secondaryHref
      : card.secondaryHref;

  return (
    <article
      className={cn(
        'hc-dorpsplein-card flex flex-col gap-3 p-4 sm:p-5',
        card.mode === 'onboarding' && 'border-dashed border-emerald-200/80 bg-emerald-50/30',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            card.mode === 'onboarding'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-700',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">{t(card.titleKey)}</h2>
          <p className="mt-0.5 text-sm text-gray-600">{t(card.descriptionKey)}</p>
        </div>
      </div>

      {loading ? (
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200/80" aria-hidden />
      ) : statLines.length > 0 ? (
        <ul className="space-y-1 text-sm font-medium text-gray-800">
          {statLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : showEmpty ? (
        <p className="text-sm text-gray-500">{t(card.emptyKey!)}</p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={card.primaryHref}
          prefetch={false}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 touch-manipulation"
        >
          {t(card.primaryLabelKey)}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        {secondaryHref && card.secondaryLabelKey ? (
          <Link
            href={secondaryHref}
            prefetch={false}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 touch-manipulation"
          >
            {t(card.secondaryLabelKey)}
          </Link>
        ) : null}
        {card.id === 'affiliate' && referralLink && card.mode === 'active' ? (
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 touch-manipulation"
            onClick={() => {
              void navigator.clipboard?.writeText(referralLink);
            }}
          >
            {t('myHomeCheffHub.cards.affiliate.shareLink')}
          </button>
        ) : null}
      </div>
    </article>
  );
}
