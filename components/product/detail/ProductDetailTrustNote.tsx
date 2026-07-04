'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { isContactOnlyProduct } from '@/lib/product/order-method';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import { cn } from '@/lib/utils';

type Props = {
  orderMethod?: ProductOrderMethodValue;
  checkoutAvailable?: boolean;
  reviewCount?: number;
  averageRating?: number;
  sellerUsername?: string | null;
  className?: string;
};

export default function ProductDetailTrustNote({
  orderMethod,
  checkoutAvailable,
  reviewCount = 0,
  averageRating = 0,
  sellerUsername,
  className,
}: Props) {
  const { t } = useTranslation();
  const contactOnly = isContactOnlyProduct({ orderMethod, priceCents: 1 });
  const profileHref = sellerUsername
    ? `/user/${encodeURIComponent(sellerUsername)}`
    : null;

  const lines: string[] = [];

  if (reviewCount > 0 && averageRating > 0) {
    lines.push(
      t('productDetail.trustReviews', {
        rating: averageRating.toFixed(1),
        count: reviewCount,
      }) ||
        `${averageRating.toFixed(1)} sterren · ${reviewCount} review${reviewCount === 1 ? '' : 's'}`,
    );
  }

  if (!contactOnly && checkoutAvailable) {
    lines.push(t('productDetail.trustStripe') || 'Veilig betalen via HomeCheff en Stripe.');
  }

  if (contactOnly) {
    lines.push(
      t('productDetail.trustContactDirect') || 'Neem direct contact op met de maker.',
    );
  } else if (lines.length === 0) {
    lines.push(
      t('productDetail.trustNeutral') ||
        'Bekijk het profiel van de maker voor meer informatie over het aanbod.',
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/80 bg-gray-50/80 px-4 py-3',
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        <div className="min-w-0 space-y-1 text-sm text-gray-700">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {profileHref ? (
            <Link
              href={profileHref}
              className="inline-block text-xs font-semibold text-secondary-brand hover:text-secondary-700"
            >
              {t('productDetail.viewProfile') || 'Bekijk profiel'} →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
