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
import { hubCopy, type HubLang } from '@/lib/navigation/my-homecheff-hub-copy';
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
  const { t, tOr, language } = useTranslation();
  const hubLang: HubLang = language === 'en' ? 'en' : 'nl';
  const cards = hubCopy(hubLang).cards;
  const Icon = CARD_ICONS[card.id];

  const titleFb = cards[card.id].title;
  let descriptionFb = cards[card.id].description;
  let primaryFb = cards[card.id].primary;
  if (card.id === 'seller' && card.mode === 'onboarding') {
    descriptionFb = cards.seller.onboardingDescription;
    primaryFb = cards.seller.onboardingPrimary;
  }
  if (card.id === 'affiliate' && card.mode === 'onboarding') {
    descriptionFb = cards.affiliate.onboardingDescription;
    primaryFb = cards.affiliate.onboardingPrimary;
  }

  const title = tOr(card.titleKey, hubCopy('en').cards[card.id].title, titleFb);
  const description = tOr(
    card.descriptionKey,
    // EN fallback resolved below via language-aware tOr (nl/en args)
    card.id === 'seller' && card.mode === 'onboarding'
      ? hubCopy('en').cards.seller.onboardingDescription
      : card.id === 'affiliate' && card.mode === 'onboarding'
        ? hubCopy('en').cards.affiliate.onboardingDescription
        : hubCopy('en').cards[card.id].description,
    descriptionFb,
  );
  const primaryLabel = tOr(
    card.primaryLabelKey,
    card.id === 'seller' && card.mode === 'onboarding'
      ? hubCopy('en').cards.seller.onboardingPrimary
      : card.id === 'affiliate' && card.mode === 'onboarding'
        ? hubCopy('en').cards.affiliate.onboardingPrimary
        : hubCopy('en').cards[card.id].primary,
    primaryFb,
  );

  const secondaryLabel = (() => {
    if (!card.secondaryLabelKey) return null;
    const nlSec =
      card.id === 'seller'
        ? cards.seller.secondary
        : card.id === 'affiliate'
          ? cards.affiliate.secondary
          : card.id === 'earnings'
            ? cards.earnings.secondary
            : card.id === 'account'
              ? cards.account.secondary
              : null;
    const enSec =
      card.id === 'seller'
        ? hubCopy('en').cards.seller.secondary
        : card.id === 'affiliate'
          ? hubCopy('en').cards.affiliate.secondary
          : card.id === 'earnings'
            ? hubCopy('en').cards.earnings.secondary
            : card.id === 'account'
              ? hubCopy('en').cards.account.secondary
              : null;
    if (!nlSec || !enSec) return null;
    return tOr(card.secondaryLabelKey, enSec, nlSec);
  })();

  const emptyLabel = (() => {
    if (!card.emptyKey) return null;
    const nlEmpty =
      card.id === 'orders'
        ? cards.orders.empty
        : card.id === 'hc'
          ? cards.hc.empty
          : card.id === 'seller'
            ? cards.seller.empty
            : card.id === 'affiliate'
              ? cards.affiliate.empty
              : card.id === 'delivery'
                ? cards.delivery.empty
                : null;
    const enEmpty =
      card.id === 'orders'
        ? hubCopy('en').cards.orders.empty
        : card.id === 'hc'
          ? hubCopy('en').cards.hc.empty
          : card.id === 'seller'
            ? hubCopy('en').cards.seller.empty
            : card.id === 'affiliate'
              ? hubCopy('en').cards.affiliate.empty
              : card.id === 'delivery'
                ? hubCopy('en').cards.delivery.empty
                : null;
    if (!nlEmpty || !enEmpty) return null;
    return tOr(card.emptyKey, enEmpty, nlEmpty);
  })();

  const shareLabel =
    card.id === 'affiliate'
      ? tOr(
          'myHomeCheffHub.cards.affiliate.shareLink',
          hubCopy('en').cards.affiliate.shareLink,
          cards.affiliate.shareLink,
        )
      : null;

  const statLines: string[] = [];

  if (card.id === 'orders' && metrics.buyerOrderCount != null) {
    const line = t('myHomeCheffHub.metrics.orderCount', { count: metrics.buyerOrderCount });
    statLines.push(
      line.trim() ||
        (hubLang === 'en'
          ? `${metrics.buyerOrderCount} orders`
          : `${metrics.buyerOrderCount} bestellingen`),
    );
  }
  if (card.id === 'seller') {
    if (metrics.sellerNewOrders != null && metrics.sellerNewOrders > 0) {
      const line = t('myHomeCheffHub.metrics.sellerOrders', { count: metrics.sellerNewOrders });
      statLines.push(
        line.trim() ||
          (hubLang === 'en'
            ? `${metrics.sellerNewOrders} new orders`
            : `${metrics.sellerNewOrders} nieuwe bestellingen`),
      );
    }
    const rev = formatEuroFromUnits(metrics.sellerRevenue7d);
    if (rev) {
      const line = t('myHomeCheffHub.metrics.sellerRevenue', { amount: rev });
      statLines.push(line.trim() || `${rev} (7d)`);
    }
  }
  if (card.id === 'affiliate') {
    const earned = formatEuro(metrics.affiliateEarnedCents);
    if (earned) {
      const line = t('myHomeCheffHub.metrics.affiliateEarned', { amount: earned });
      statLines.push(line.trim() || earned);
    }
    if (metrics.affiliateReferrals != null && metrics.affiliateReferrals > 0) {
      const line = t('myHomeCheffHub.metrics.affiliateReferrals', {
        count: metrics.affiliateReferrals,
      });
      statLines.push(
        line.trim() ||
          (hubLang === 'en'
            ? `${metrics.affiliateReferrals} referrals`
            : `${metrics.affiliateReferrals} referrals`),
      );
    }
  }
  if (card.id === 'delivery') {
    if (metrics.deliveryActiveJobs != null && metrics.deliveryActiveJobs > 0) {
      const line = t('myHomeCheffHub.metrics.deliveryJobs', { count: metrics.deliveryActiveJobs });
      statLines.push(
        line.trim() ||
          (hubLang === 'en'
            ? `${metrics.deliveryActiveJobs} active jobs`
            : `${metrics.deliveryActiveJobs} actieve opdrachten`),
      );
    }
    const today = formatEuroFromUnits(metrics.deliveryEarningsToday);
    if (today) {
      const line = t('myHomeCheffHub.metrics.deliveryEarnings', { amount: today });
      statLines.push(line.trim() || today);
    }
  }
  if (card.id === 'earnings') {
    const total = formatEuro(metrics.totalEarningsCents);
    if (total) {
      const line = t('myHomeCheffHub.metrics.totalEarnings', { amount: total });
      statLines.push(line.trim() || total);
    }
  }

  const showEmpty =
    card.mode === 'active' &&
    Boolean(emptyLabel) &&
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
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>
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
        <p className="text-sm text-gray-500">{emptyLabel}</p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={card.primaryHref}
          prefetch={false}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 touch-manipulation"
        >
          {primaryLabel}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            prefetch={false}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 touch-manipulation"
          >
            {secondaryLabel}
          </Link>
        ) : null}
        {card.id === 'affiliate' && referralLink && card.mode === 'active' && shareLabel ? (
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 touch-manipulation"
            onClick={() => {
              void navigator.clipboard?.writeText(referralLink);
            }}
          >
            {shareLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
