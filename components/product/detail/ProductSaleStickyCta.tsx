'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, ArrowRight, MessageCircle } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import {
  formatProductPriceLabel,
  isContactOnlyProduct,
  requiresStripeForHomecheffCheckout,
} from '@/lib/product/order-method';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type ProductShape = {
  id: string;
  title: string;
  priceCents: number;
  orderMethod?: ProductOrderMethodValue;
  delivery?: string | null;
  image?: string | null;
  seller?: { User?: { id?: string } } | null;
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
  hidden?: boolean;
};

export default function ProductSaleStickyCta({
  product,
  carouselImageUrl,
  sellerName,
  quantity,
  availableStock,
  isOwner,
  checkoutAvailable,
  publicContactChannels,
  hidden = false,
}: Props) {
  const { t, tOr } = useTranslation();
  const router = useRouter();
  const { addItem, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (hidden || isOwner) return null;

  const isOutOfStock = availableStock !== null && availableStock === 0;
  const contactOnly = isContactOnlyProduct(product);
  const contactOnlyWithChannels =
    contactOnly && product.seller?.User?.id && publicContactChannels.length > 0;
  const contactOnlyNoChannels = contactOnly && !contactOnlyWithChannels;
  const paymentsBlocked =
    requiresStripeForHomecheffCheckout(product) && !checkoutAvailable;
  const paymentsBlockedWithChannels =
    paymentsBlocked && product.seller?.User?.id && publicContactChannels.length > 0;
  const productInCart = items.some(
    (item) => item.productId === product.id || item.id === product.id,
  );
  const checkoutMode = productInCart || justAdded;

  const scrollToCta = () => {
    document
      .getElementById('commerce-cta')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAdd = async () => {
    setIsAdding(true);
    await new Promise((r) => setTimeout(r, 300));
    const result = addItem(
      {
        id: product.id,
        productId: product.id,
        title: product.title,
        priceCents: product.priceCents,
        image: carouselImageUrl || product.image || undefined,
        sellerName,
        sellerId: product.seller?.User?.id || '',
        deliveryMode: (product.delivery as string) || 'PICKUP',
        stock: availableStock,
        maxQuantity:
          typeof availableStock === 'number' && availableStock >= 0
            ? availableStock
            : null,
      },
      quantity,
    );
    setIsAdding(false);
    if (result.addedQuantity > 0) {
      setJustAdded(true);
    }
  };

  let actionLabel = tOr('cart.addToCart', 'Add to cart', 'In winkelwagen');
  let onAction: () => void = handleAdd;
  let disabled = isAdding || isOutOfStock;
  let showCartIcon = true;
  let showCheck = false;

  if (checkoutMode && !contactOnly && !paymentsBlocked && !isOutOfStock) {
    actionLabel = tOr('cart.goToCheckout', 'Go to checkout', 'Afrekenen');
    onAction = () => router.push('/checkout');
    disabled = false;
    showCartIcon = false;
  } else if (contactOnlyWithChannels) {
    actionLabel = tOr('productDetail.contactMaker', 'Contact maker', 'Bericht sturen');
    onAction = scrollToCta;
    disabled = false;
    showCartIcon = false;
  } else if (contactOnlyNoChannels) {
    actionLabel = tOr('productDetail.viewOffer', 'View offer', 'Bekijk aanbod');
    onAction = scrollToCta;
    disabled = false;
    showCartIcon = false;
  } else if (paymentsBlockedWithChannels) {
    actionLabel = tOr('productDetail.contactMaker', 'Contact maker', 'Bericht sturen');
    onAction = scrollToCta;
    disabled = false;
    showCartIcon = false;
  } else if (paymentsBlocked) {
    actionLabel = tOr('productDetail.viewOffer', 'View offer', 'Bekijk aanbod');
    onAction = scrollToCta;
    disabled = false;
    showCartIcon = false;
  } else if (isOutOfStock) {
    actionLabel = 'Uitverkocht';
    onAction = () => {};
    disabled = true;
  } else if (justAdded) {
    showCheck = true;
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden',
        'bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 shrink-0">
          <div className="text-lg font-bold leading-none text-gray-900">
            {formatProductPriceLabel(product, t)}
          </div>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onAction}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary-brand px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAdding ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : showCheck ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : checkoutMode && !contactOnly ? (
            <ArrowRight className="h-4 w-4" aria-hidden />
          ) : contactOnlyWithChannels || contactOnlyNoChannels || paymentsBlockedWithChannels ? (
            <MessageCircle className="h-4 w-4" aria-hidden />
          ) : showCartIcon ? (
            <ShoppingCart className="h-4 w-4" aria-hidden />
          ) : null}
          <span>{actionLabel}</span>
        </button>
      </div>
    </div>
  );
}
