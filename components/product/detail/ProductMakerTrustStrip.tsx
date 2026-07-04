'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import BusinessBadge from '@/components/ui/BusinessBadge';
import UserBadgeChips from '@/components/gamification/UserBadgeChips';
import ClickableName from '@/components/ui/ClickableName';
import {
  EMPTY_USER_STATS,
  fetchUserStatsDeduped,
  getCachedUserStats,
} from '@/lib/userStatsClientCache';
import type { UserBadgeChipItem } from '@/components/gamification/UserBadgeChips';
import { cn } from '@/lib/utils';

type Props = {
  sellerUser?: {
    id?: string;
    name?: string | null;
    username?: string | null;
    avatar?: string | null;
    profileImage?: string | null;
    image?: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
    place?: string | null;
  } | null;
  sellerBadges?: UserBadgeChipItem[] | null;
  isBusiness?: boolean;
  companyName?: string | null;
  productStats?: {
    reviewCount?: number;
    averageRating?: number;
    orderCount?: number;
    favoriteCount?: number;
  };
  makerLine?: string | null;
  className?: string;
};

export default function ProductMakerTrustStrip({
  sellerUser,
  sellerBadges,
  isBusiness,
  companyName,
  productStats,
  makerLine,
  className,
}: Props) {
  const { t } = useTranslation();
  const userId = sellerUser?.id ?? null;
  const [stats, setStats] = useState(() =>
    userId ? getCachedUserStats(userId) : null,
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void fetchUserStatsDeduped(userId).then((data) => {
      if (!cancelled) setStats(data);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!sellerUser?.id) return null;

  const s = stats ?? EMPTY_USER_STATS;
  const avatar =
    sellerUser.avatar || sellerUser.profileImage || sellerUser.image || null;
  const chips: string[] = [];

  if (productStats?.reviewCount && productStats.reviewCount > 0) {
    chips.push(
      `${productStats.averageRating?.toFixed(1) ?? '0'}★ (${productStats.reviewCount})`,
    );
  }
  if (productStats?.orderCount && productStats.orderCount > 0) {
    chips.push(
      t('productDetail.ordersCount', { count: productStats.orderCount }) ||
        `${productStats.orderCount} verkopen`,
    );
  }
  if (s.fansCount > 0) {
    chips.push(`${s.fansCount} fans`);
  }
  if (s.totalProps > 0) {
    chips.push(`${s.totalProps} props`);
  } else if (productStats?.favoriteCount && productStats.favoriteCount > 0) {
    chips.push(`${productStats.favoriteCount} props`);
  }
  if (s.averageRating > 0 && s.totalReviews > 0 && !productStats?.reviewCount) {
    chips.push(`${s.averageRating.toFixed(1)}★ maker`);
  }

  const hasBadges = (sellerBadges?.length ?? 0) > 0;
  const hasChips = chips.length > 0;

  if (!hasChips && !hasBadges && !isBusiness) {
    return (
      <div
        className={cn(
          'rounded-xl border border-gray-200/80 bg-white px-3 py-2.5',
          className,
        )}
      >
        <div className="flex items-center gap-3">
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-brand">
              {(sellerUser.name || sellerUser.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <ClickableName
              user={sellerUser}
              className="text-sm font-semibold text-gray-900 hover:text-primary-brand"
              fallbackText={t('product.sellerFallback') || 'Maker'}
              linkTo="profile"
            />
            {sellerUser.place ? (
              <p className="truncate text-xs text-gray-500">{sellerUser.place}</p>
            ) : null}
            {makerLine ? (
              <p className="text-xs leading-snug text-gray-600">{makerLine}</p>
            ) : null}
          </div>
          <Link
            href={
              sellerUser.username
                ? `/user/${encodeURIComponent(sellerUser.username)}`
                : '/profile'
            }
            className="shrink-0 text-xs font-semibold text-secondary-brand hover:text-secondary-700"
          >
            {t('productDetail.viewProfile') || 'Profiel'} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200/80 bg-gradient-to-br from-gray-50/90 to-white px-3 py-2.5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {avatar ? (
          <Image
            src={avatar}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-brand ring-2 ring-white">
            {(sellerUser.name || sellerUser.username || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <ClickableName
              user={sellerUser}
              className="text-sm font-semibold text-gray-900 hover:text-primary-brand"
              fallbackText={t('product.sellerFallback') || 'Maker'}
              linkTo="profile"
            />
            {isBusiness && companyName ? (
              <BusinessBadge companyName={companyName} variant="compact" />
            ) : null}
          </div>
          {sellerUser.place ? (
            <p className="truncate text-xs text-gray-500">{sellerUser.place}</p>
          ) : null}
          {makerLine ? (
            <p className="text-xs leading-snug text-gray-600">{makerLine}</p>
          ) : null}
          {hasChips ? (
            <p className="flex flex-wrap items-center gap-x-1 text-[11px] font-medium text-gray-600">
              {chips.map((chip, i) => (
                <span key={chip} className="inline-flex items-center gap-1">
                  {i > 0 ? <span className="text-gray-300">·</span> : null}
                  {chip.includes('★') ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                      {chip.replace('★', '').trim()}
                    </span>
                  ) : (
                    chip
                  )}
                </span>
              ))}
            </p>
          ) : null}
          {hasBadges ? (
            <UserBadgeChips badges={sellerBadges} max={2} size="sm" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
