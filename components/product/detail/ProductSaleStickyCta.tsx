'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, ArrowRight, ClipboardList } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import StartChatButton from '@/components/chat/StartChatButton';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import { formatCommercePriceLabel } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import {
  resolveMarketplaceCtaActions,
  toMarketplaceCtaContext,
} from '@/lib/marketplace/settlement/settlement-router';
import {
  EXCHANGE_FUNNEL_EVENTS,
  trackExchangeFunnelEvent,
} from '@/lib/marketplace/exchange/exchange-funnel-analytics';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type ProductShape = {
  id: string;
  title: string;
  priceCents: number;
  orderMethod?: ProductOrderMethodValue;
  acceptHomeCheffPayment?: boolean | null;
  acceptDirectContact?: boolean | null;
  barterOpenness?: string | null;
  priceModel?: string | null;
  listingIntent?: string | null;
  specializations?: string[] | null;
  acceptedSpecializations?: string[];
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
  const { t } = useTranslation();
  const router = useRouter();
  const { addItem, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (hidden || isOwner) return null;

  const isOutOfStock = availableStock !== null && availableStock === 0;
  const sellerId = product.seller?.User?.id ?? '';
  const hasChat = publicContactChannels.some((c) => c.id === 'chat');

  const cta = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(product, {
      stripeConnectReady: checkoutAvailable,
      hasContactChannels: publicContactChannels.length > 0,
      inStock: !isOutOfStock,
      isOwner,
    }),
  );

  const productInCart = items.some(
    (item) => item.productId === product.id || item.id === product.id,
  );
  const checkoutMode = cta.showCheckout && (productInCart || justAdded);

  const scrollToCta = (targetId = 'commerce-cta') => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
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
        barterOpenness: product.barterOpenness ?? null,
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
      trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.stickyCheckoutClick, {
        listingId: product.id,
        barterOpenness: product.barterOpenness,
        acceptedSpecializations: product.acceptedSpecializations,
        orderMethod: product.orderMethod,
        surface: 'sticky',
        entrypoint: 'sticky_add_to_cart',
      });
    }
  };

  const priceLabel = formatCommercePriceLabel(product, t);

  if (cta.primaryFlow === 'PROPOSAL' && cta.showProposal && hasChat && sellerId) {
    return (
      <div
        className={cn(
          'fixed inset-x-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden',
          'max-lg:bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 shrink-0">
            <div className="text-lg font-bold leading-none text-gray-900">{priceLabel}</div>
          </div>
          <StartChatButton
            productId={product.id}
            sellerId={sellerId}
            sellerName={sellerName}
            skipModal
            openProposalAfterStart
            label={t(cta.proposalLabelKey)}
            funnelListing={{
              listingId: product.id,
              barterOpenness: product.barterOpenness,
              acceptedSpecializations: product.acceptedSpecializations,
              orderMethod: product.orderMethod,
            }}
            funnelSurface="sticky"
            funnelEntrypoint="sticky_proposal_deep_link"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary-brand px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 !from-primary-brand !to-primary-brand hover:!from-primary-700 hover:!to-primary-700"
          />
        </div>
      </div>
    );
  }

  let actionLabel = t('cart.addToCart');
  let onAction: () => void = handleAdd;
  let disabled = isAdding || isOutOfStock;
  let showCartIcon = true;
  let showCheck = false;

  if (cta.checkoutNeedsConnect && cta.showProposal) {
    actionLabel = t(cta.proposalLabelKey);
    onAction = () => scrollToCta();
    disabled = false;
    showCartIcon = false;
  } else if (checkoutMode && cta.showCheckout && !isOutOfStock) {
    actionLabel = t('cart.goToCheckout');
    onAction = () => {
      trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.stickyCheckoutClick, {
        listingId: product.id,
        barterOpenness: product.barterOpenness,
        acceptedSpecializations: product.acceptedSpecializations,
        orderMethod: product.orderMethod,
        surface: 'sticky',
        entrypoint: 'sticky_go_to_checkout',
      });
      router.push('/checkout');
    };
    disabled = false;
    showCartIcon = false;
  } else if (cta.showContactOnly && publicContactChannels.length > 0) {
    actionLabel = t(cta.proposalLabelKey);
    onAction = () => scrollToCta();
    disabled = false;
    showCartIcon = false;
  } else if (cta.showContactOnly) {
    actionLabel = t('productDetail.viewOffer');
    onAction = () => scrollToCta();
    disabled = false;
    showCartIcon = false;
  } else if (cta.checkoutNeedsConnect) {
    actionLabel = t('productDetail.viewOffer');
    onAction = () => scrollToCta();
    disabled = false;
    showCartIcon = false;
  } else if (justAdded) {
    showCheck = true;
    actionLabel = t('cart.goToCheckout');
    onAction = () => router.push('/checkout');
    showCartIcon = false;
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden',
        'max-lg:bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 shrink-0">
          <div className="text-lg font-bold leading-none text-gray-900">{priceLabel}</div>
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary-brand px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {showCheck ? (
            <Check className="h-4 w-4 shrink-0" aria-hidden />
          ) : showCartIcon ? (
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
          ) : cta.showProposal ? (
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
