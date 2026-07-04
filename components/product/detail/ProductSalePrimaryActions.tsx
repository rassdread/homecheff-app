'use client';

import Link from 'next/link';
import { Edit3 } from 'lucide-react';
import AddToCartButton from '@/components/cart/AddToCartButton';
import MakerContactSection from '@/components/profile/MakerContactSection';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import {
  isContactOnlyProduct,
  requiresStripeForHomecheffCheckout,
} from '@/lib/product/order-method';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import { useTranslation } from '@/hooks/useTranslation';
import { buildProductSlugPath } from '@/lib/seo/productSlug';
import { cn } from '@/lib/utils';

type ProductShape = {
  id: string;
  title: string;
  priceCents: number;
  orderMethod?: ProductOrderMethodValue;
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
  publicContactChannels,
  onAdded,
  compact = false,
  className,
}: Props) {
  const { t, tOr } = useTranslation();
  const isOutOfStock = availableStock !== null && availableStock === 0;

  if (isContactOnlyProduct(product) && !isOwner) {
    if (product.seller?.User?.id && publicContactChannels.length > 0) {
      return (
        <div id="commerce-cta" className={cn(className)}>
          <MakerContactSection
            variant="product"
            makerId={product.seller.User.id}
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
    requiresStripeForHomecheffCheckout(product) &&
    !checkoutAvailable
  ) {
    return (
      <div
        id="commerce-cta"
        className={cn(
          'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 leading-relaxed',
          className,
        )}
      >
        {t('productOrder.buyerPaymentsNotReady')}
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
        Uitverkocht
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

  return (
    <div id="commerce-cta" className={cn(className)}>
      <AddToCartButton
        product={{
          id: product.id,
          title: product.title,
          priceCents: product.priceCents,
          image: carouselImageUrl || product.image || undefined,
          sellerName,
          sellerId: product.seller?.User?.id || '',
          deliveryMode: (product.delivery as string) || 'PICKUP',
          stock: availableStock,
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
    </div>
  );
}
