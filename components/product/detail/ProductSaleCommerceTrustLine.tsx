'use client';

import { useEffect, useMemo, useState } from 'react';
import { Shield, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildSmartTrustLines,
  toProductStoryInput,
  type ProductStoryInput,
} from '@/lib/product/product-story-copy';
import {
  EMPTY_USER_STATS,
  fetchUserStatsDeduped,
  getCachedUserStats,
} from '@/lib/userStatsClientCache';
import { cn } from '@/lib/utils';

type Props = {
  product: Parameters<typeof toProductStoryInput>[0]['product'];
  sellerName: string;
  stats: {
    reviewCount: number;
    averageRating: number;
    orderCount: number;
  };
  checkoutAvailable: boolean;
  isBusiness?: boolean;
  companyName?: string | null;
  sellerBadgeCount?: number;
  sellerUserId?: string | null;
  className?: string;
};

export default function ProductSaleCommerceTrustLine({
  product,
  sellerName,
  stats,
  checkoutAvailable,
  isBusiness = false,
  companyName,
  sellerBadgeCount = 0,
  sellerUserId,
  className,
}: Props) {
  const { language } = useTranslation();
  const locale = language?.startsWith('en') ? 'en' : 'nl';
  const [sellerProps, setSellerProps] = useState<number | null>(() => {
    if (!sellerUserId) return null;
    return getCachedUserStats(sellerUserId)?.totalProps ?? null;
  });
  const [sellerFans, setSellerFans] = useState<number | null>(() => {
    if (!sellerUserId) return null;
    return getCachedUserStats(sellerUserId)?.fansCount ?? null;
  });

  useEffect(() => {
    if (!sellerUserId) return;
    let cancelled = false;
    void fetchUserStatsDeduped(sellerUserId).then((data) => {
      if (!cancelled) {
        setSellerProps(data.totalProps ?? EMPTY_USER_STATS.totalProps);
        setSellerFans(data.fansCount ?? EMPTY_USER_STATS.fansCount);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sellerUserId]);

  const lines = useMemo(() => {
    const input: ProductStoryInput = toProductStoryInput({
      product,
      sellerName,
      stats,
      checkoutAvailable,
      isBusiness,
      companyName,
      sellerBadgeCount,
      sellerTotalProps: sellerProps ?? 0,
      sellerFansCount: sellerFans ?? 0,
      locale,
    });
    return buildSmartTrustLines(input);
  }, [
    product,
    sellerName,
    stats,
    checkoutAvailable,
    isBusiness,
    companyName,
    sellerBadgeCount,
    sellerProps,
    sellerFans,
    locale,
  ]);

  if (lines.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2',
        className,
      )}
    >
      <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {lines.map((line) => (
          <p
            key={line}
            className="flex items-center gap-1 text-xs font-medium leading-snug text-gray-700"
          >
            {line.includes('sterren') || line.includes('stars') ? (
              <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
            ) : null}
            <span>{line.replace(/★/g, '').trim()}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
