'use client';

import { Star, Shield } from 'lucide-react';
import BusinessBadge from '@/components/ui/BusinessBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { isContactOnlyProduct } from '@/lib/product/order-method';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import { cn } from '@/lib/utils';

type Props = {
  reviewCount?: number;
  averageRating?: number;
  orderCount?: number;
  checkoutAvailable?: boolean;
  orderMethod?: ProductOrderMethodValue;
  isBusiness?: boolean;
  companyName?: string | null;
  className?: string;
};

export default function ProductSaleCommerceTrustLine({
  reviewCount = 0,
  averageRating = 0,
  orderCount = 0,
  checkoutAvailable = true,
  orderMethod,
  isBusiness = false,
  companyName,
  className,
}: Props) {
  const { t } = useTranslation();
  const contactOnly = isContactOnlyProduct({ orderMethod, priceCents: 1 });
  const chips: string[] = [];

  if (reviewCount > 0 && averageRating > 0) {
    chips.push(`review:${averageRating.toFixed(1)}:${reviewCount}`);
  }

  if (orderCount > 0) {
    chips.push(
      t('productDetail.ordersCount', { count: orderCount }) ||
        `${orderCount} verkopen`,
    );
  }

  if (!contactOnly && checkoutAvailable) {
    chips.push(t('productDetail.trustStripe') || 'Veilig betalen via HomeCheff en Stripe.');
  }

  if (contactOnly) {
    chips.push(
      t('productDetail.trustContactDirect') || 'Neem direct contact op met de maker.',
    );
  }

  if (chips.length === 0 && !isBusiness) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2',
        className,
      )}
    >
      <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-gray-700">
        {chips.map((chip, index) => (
          <span key={chip} className="inline-flex items-center gap-1">
            {index > 0 ? <span className="text-gray-300" aria-hidden>·</span> : null}
            {chip.startsWith('review:') ? (
              <>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                <span>
                  {chip.split(':')[1]} ({chip.split(':')[2]})
                </span>
              </>
            ) : (
              chip
            )}
          </span>
        ))}
        {isBusiness ? (
          <>
            {chips.length > 0 ? (
              <span className="text-gray-300" aria-hidden>
                ·
              </span>
            ) : null}
            <BusinessBadge companyName={companyName} variant="compact" />
          </>
        ) : null}
      </div>
    </div>
  );
}
