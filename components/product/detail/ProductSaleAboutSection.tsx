'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildAboutProductBlock,
  buildEmptyReviewState,
  buildSmartMakerLine,
  buildSmartProductSummary,
  toProductStoryInput,
} from '@/lib/product/product-story-copy';
import { cn } from '@/lib/utils';

type ProductShape = {
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  tags?: string[] | null;
  delivery?: string | null;
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  sellerCanDeliver?: boolean | null;
  deliveryRadiusKm?: number | null;
  orderMethod?: string | null;
  priceCents?: number | null;
  stock?: number | null;
  seller?: {
    lat?: number | null;
    lng?: number | null;
    User?: {
      place?: string | null;
      city?: string | null;
      lat?: number | null;
      lng?: number | null;
    } | null;
  } | null;
};

type Props = {
  product: ProductShape;
  sellerName: string;
  categoryLabel?: string;
  stats: {
    reviewCount: number;
    averageRating: number;
    orderCount: number;
  };
  checkoutAvailable: boolean;
  isBusiness?: boolean;
  companyName?: string | null;
  sellerBadgeCount?: number;
  className?: string;
};

export function useProductStoryCopy({
  product,
  sellerName,
  categoryLabel,
  stats,
  checkoutAvailable,
  isBusiness,
  companyName,
  sellerBadgeCount = 0,
}: Omit<Props, 'className'>) {
  const { language, t } = useTranslation();
  const locale = language?.startsWith('en') ? 'en' : 'nl';

  return useMemo(() => {
    const input = toProductStoryInput({
      product,
      sellerName,
      stats,
      checkoutAvailable,
      isBusiness,
      companyName,
      sellerBadgeCount,
      locale,
    });
    const summary = buildSmartProductSummary(input);
    const makerLine = buildSmartMakerLine(input);
    const about = buildAboutProductBlock(input, summary, categoryLabel);
    const emptyReview = buildEmptyReviewState(input);
    return { input, summary, makerLine, about, emptyReview };
  }, [
    product,
    sellerName,
    categoryLabel,
    stats,
    checkoutAvailable,
    isBusiness,
    companyName,
    sellerBadgeCount,
    locale,
    t,
  ]);
}

type AboutProps = Props;

export default function ProductSaleAboutSection({
  product,
  sellerName,
  categoryLabel,
  stats,
  checkoutAvailable,
  isBusiness,
  companyName,
  sellerBadgeCount = 0,
  className,
}: AboutProps) {
  const { t } = useTranslation();
  const { about } = useProductStoryCopy({
    product,
    sellerName,
    categoryLabel,
    stats,
    checkoutAvailable,
    isBusiness,
    companyName,
    sellerBadgeCount,
  });

  const hasDescription = Boolean(about.description);
  const hasContext = about.contextLines.length > 0;

  if (!hasDescription && !hasContext) {
    return (
      <div className={cn('rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5', className)}>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          {t('productDetail.aboutProduct') || 'Over dit product'}
        </h2>
        <p className="text-sm text-gray-500">{t('product.noDescription')}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5', className)}>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        {t('productDetail.aboutProduct') || 'Over dit product'}
      </h2>
      {hasDescription ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
          {about.description}
        </p>
      ) : null}
      {hasContext ? (
        <ul
          className={cn(
            'space-y-1 text-sm text-gray-600',
            hasDescription ? 'mt-3 border-t border-gray-100 pt-3' : '',
          )}
        >
          {about.contextLines.map((line) => (
            <li key={line} className="leading-snug">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
