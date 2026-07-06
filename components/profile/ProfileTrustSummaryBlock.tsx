'use client';

import { Star, ShoppingBag, Handshake, Truck } from 'lucide-react';
import MarketplaceBadgeList from '@/components/marketplace/MarketplaceBadgeList';
import { useTranslation } from '@/hooks/useTranslation';
import type { ProfileTrustSummary, TrustChannelSummary } from '@/lib/trust/profile-trust-summary';

type Props = {
  summary: ProfileTrustSummary;
  className?: string;
};

function renderStars(rating: number | null) {
  if (rating == null) return '—';
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}

function TrustChannelBlock({
  icon: Icon,
  label,
  channel,
}: {
  icon: typeof Star;
  label: string;
  channel: TrustChannelSummary;
}) {
  if (channel.reviewCount === 0) return null;

  return (
    <div className="rounded-xl border border-emerald-100 bg-white/80 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <p className="font-semibold text-sm text-emerald-950" aria-label={channel.averageRating?.toString() ?? ''}>
        {renderStars(channel.averageRating)}
        {channel.averageRating != null ? (
          <span className="ml-1 text-[11px] font-normal text-emerald-800">
            ({channel.averageRating}) · {channel.reviewCount}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export default function ProfileTrustSummaryBlock({ summary, className }: Props) {
  const { t } = useTranslation();

  const hasTrustChannel =
    summary.product.reviewCount > 0 ||
    summary.deal.reviewCount > 0 ||
    summary.courier.reviewCount > 0;

  const hasTotals =
    summary.totals.completedDeals > 0 ||
    summary.totals.completedDeliveries > 0 ||
    summary.totals.repeatCustomers > 0;

  if (!hasTrustChannel && !hasTotals && summary.topSpecializations.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-3 ${className ?? ''}`}
    >
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-emerald-700" aria-hidden />
        <h3 className="text-sm font-semibold text-emerald-950">
          {t('trust.profile.heading')}
        </h3>
      </div>

      {hasTrustChannel ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <TrustChannelBlock
            icon={ShoppingBag}
            label={t('trust.profile.channelProducts')}
            channel={summary.product}
          />
          <TrustChannelBlock
            icon={Handshake}
            label={t('trust.profile.channelDeals')}
            channel={summary.deal}
          />
          <TrustChannelBlock
            icon={Truck}
            label={t('trust.profile.channelDeliveries')}
            channel={summary.courier}
          />
        </div>
      ) : null}

      {hasTotals ? (
        <div className="grid grid-cols-2 gap-2 text-xs text-emerald-900 sm:grid-cols-3">
          {summary.totals.completedDeals > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">
                {t('trust.profile.completedDeals')}
              </p>
              <p className="font-semibold text-sm">{summary.totals.completedDeals}</p>
            </div>
          ) : null}
          {summary.totals.completedDeliveries > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">
                {t('trust.profile.completedDeliveries')}
              </p>
              <p className="font-semibold text-sm">{summary.totals.completedDeliveries}</p>
            </div>
          ) : null}
          {summary.totals.repeatCustomers > 0 ? (
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">
                {t('trust.profile.repeatCustomers', { count: summary.totals.repeatCustomers })}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {summary.topSpecializations.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
            {t('trust.profile.topSpecializations')}
          </p>
          <MarketplaceBadgeList
            specializations={summary.topSpecializations}
            variant="accepted"
            maxVisible={5}
            size="sm"
          />
        </div>
      ) : null}

      <p className="text-[10px] text-emerald-700">
        {t('trust.profile.memberSince', {
          date: new Date(summary.memberSince).toLocaleDateString('nl-NL', {
            month: 'long',
            year: 'numeric',
          }),
        })}
      </p>
    </div>
  );
}
