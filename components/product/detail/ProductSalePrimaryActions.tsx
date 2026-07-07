'use client';

import Link from 'next/link';
import { Edit3 } from 'lucide-react';
import AddToCartButton from '@/components/cart/AddToCartButton';
import MakerContactSection from '@/components/profile/MakerContactSection';
import ProductSaleProposalAction from '@/components/product/detail/ProductSaleProposalAction';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import {
  isContactOnlyProduct,
  requiresStripeForHomecheffCheckout,
} from '@/lib/product/order-method';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import { resolveProductCommerceActions } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import {
  getBuyerPaymentWarningKey,
  type PublicPaymentStatus,
} from '@/lib/stripe/seller-payment-status';
import { useTranslation } from '@/hooks/useTranslation';
import { buildProductSlugPath } from '@/lib/seo/productSlug';
import { cn } from '@/lib/utils';

type ProductShape = {
  id: string;
  title: string;
  priceCents: number;
  orderMethod?: ProductOrderMethodValue;
  barterOpenness?: string | null;
  delivery?: string | null;
  image?: string | null;
  seller?: {
    User?: {
      id?: string;
      place?: string | null;
    };
  } | null;
};

type Props = {
  product: ProductShape;
  carouselImageUrl?: string | null;
  sellerName: string;
  quantity: number;
  availableStock: number | null;
  isOwner: boolean;
  checkoutAvailable: boolean;
  paymentStatus?: PublicPaymentStatus | null;
  publicContactChannels: PublicContactChannel[];
  onAdded?: () => void;
  compact?: boolean;
  className?: string;
};

export default function ProductSalePrimaryActions({
  product,
  carouselImageUrl,
  sellerName,
  quantity,
  availableStock,
  isOwner,
  checkoutAvailable,
  paymentStatus,
  publicContactChannels,
  onAdded,
  compact = false,
  className,
}: Props) {
  const { t, tOr } = useTranslation();
  const isOutOfStock = availableStock !== null && availableStock === 0;
  const commerceActions = resolveProductCommerceActions(product.barterOpenness);
  const sellerId = product.seller?.User?.id;

  if (isContactOnlyProduct(product) && !isOwner) {
    if (sellerId && publicContactChannels.length > 0) {
      return (
        <div id="commerce-cta" className={cn(className)}>
          <MakerContactSection
            variant="product"
            makerId={sellerId}
            makerName={sellerName}
            channels={publicContactChannels}
            productId={product.id}
            className={compact ? '!p-3' : '!border-gray-200 !bg-gray-50 text-gray-900 shadow-sm'}
          />
        </div>
      );
    }

    return (
      <div
        id="commerce-cta"
        className={cn(
          'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950',
          className,
        )}
      >
        {tOr(
          'productDetail.contactNotConfigured',
          'This maker has not set up contact options yet.',
          'Deze maker heeft nog geen contactopties ingesteld.',
        )}
      </div>
    );
  }

  if (
    !isOwner &&
    commerceActions.showOrderCheckout &&
    requiresStripeForHomecheffCheckout(product) &&
    !checkoutAvailable
  ) {
    const warningKey = getBuyerPaymentWarningKey(paymentStatus);
    const hasContactChannels = publicContactChannels.length > 0;

    return (
      <div id="commerce-cta" className={cn('space-y-3', className)}>
        <div
          className={cn(
            'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 leading-relaxed',
          )}
        >
          {t(warningKey)}
        </div>
        {sellerId && hasContactChannels ? (
          <MakerContactSection
            variant="product"
            makerId={sellerId}
            makerName={sellerName}
            channels={publicContactChannels}
            productId={product.id}
            className={compact ? '!p-3' : '!border-gray-200 !bg-gray-50 text-gray-900 shadow-sm'}
          />
        ) : !hasContactChannels ? (
          <p className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {tOr(
              'productDetail.contactNotConfigured',
              'This maker has not set up contact options yet.',
              'Deze maker heeft nog geen contactopties ingesteld.',
            )}
          </p>
        ) : null}
      </div>
    );
  }

  if (isOutOfStock) {
    return (
      <div
        id="commerce-cta"
        className={cn(
          'rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-center text-sm font-bold text-gray-700',
          className,
        )}
      >
        {t('productDetail.outOfStock')}
      </div>
    );
  }

  if (isOwner) {
    return (
      <div id="commerce-cta" className={cn(className)}>
        <Link
          href={`/product/${buildProductSlugPath(product.title, product.seller?.User?.place, product.id)}/edit`}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-brand py-3 px-4 text-center font-bold text-white shadow-md transition hover:bg-primary-700',
            compact && 'py-2 text-sm',
          )}
        >
          <Edit3 className="h-4 w-4" aria-hidden />
          {t('product.editProduct')}
        </Link>
      </div>
    );
  }

  if (!commerceActions.showOrderCheckout && commerceActions.showProposalCta) {
    return (
      <div id="commerce-cta" className={cn(className)}>
        {sellerId ? (
          <ProductSaleProposalAction
            productId={product.id}
            sellerId={sellerId}
            sellerName={sellerName}
            publicContactChannels={publicContactChannels}
            primary
          />
        ) : null}
      </div>
    );
  }

  return (
    <div id="commerce-cta" className={cn('space-y-3', className)}>
      {commerceActions.showOrderCheckout ? (
        <>
          <p className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-medium leading-relaxed text-emerald-900">
            {t('productDetail.commercePathCheckout')}
          </p>
          <AddToCartButton
            product={{
              id: product.id,
              title: product.title,
              priceCents: product.priceCents,
              image: carouselImageUrl || product.image || undefined,
              sellerName,
              sellerId: sellerId || '',
              deliveryMode: (product.delivery as string) || 'PICKUP',
              stock: availableStock,
              barterOpenness: product.barterOpenness ?? null,
            }}
            className={cn(
              compact
                ? '!rounded-xl !py-2 !text-sm !bg-primary-brand !text-white hover:!bg-primary-700'
                : 'w-full !bg-primary-brand !text-white font-bold shadow-lg hover:!bg-primary-700 hover:!scale-[1.02]',
            )}
            size={compact ? 'sm' : 'lg'}
            variant="outline"
            quantity={quantity}
            onAdded={onAdded}
            surface="light"
          />
        </>
      ) : null}
      {commerceActions.showProposalCta && sellerId ? (
        <ProductSaleProposalAction
          productId={product.id}
          sellerId={sellerId}
          sellerName={sellerName}
          publicContactChannels={publicContactChannels}
        />
      ) : null}
    </div>
  );
}
