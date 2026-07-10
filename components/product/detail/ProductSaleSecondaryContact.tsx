'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import MakerContactSection from '@/components/profile/MakerContactSection';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';
import {
  resolveMarketplaceCtaActions,
  toMarketplaceCtaContext,
} from '@/lib/marketplace/settlement/settlement-router';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  product: {
    id: string;
    orderMethod?: ProductOrderMethodValue;
    acceptHomeCheffPayment?: boolean | null;
    acceptDirectContact?: boolean | null;
    barterOpenness?: string | null;
    acceptedSpecializations?: string[] | null;
    listingIntent?: string | null;
    seller?: { User?: { id?: string } } | null;
  };
  sellerName: string;
  publicContactChannels: PublicContactChannel[];
  checkoutAvailable?: boolean;
  className?: string;
};

export default function ProductSaleSecondaryContact({
  product,
  sellerName,
  publicContactChannels,
  checkoutAvailable = true,
  className,
}: Props) {
  const { t, tOr } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const cta = resolveMarketplaceCtaActions(
    toMarketplaceCtaContext(product, {
      stripeConnectReady: checkoutAvailable,
      hasContactChannels: publicContactChannels.length > 0,
    }),
  );

  if (!cta.showCheckout || cta.showContactOnly) return null;
  if (!product.seller?.User?.id || publicContactChannels.length === 0) return null;

  const askLabel = t('marketplace.cta.startConversation');

  return (
    <div id="commerce-secondary-contact" className={cn('space-y-2', className)}>
      <p className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-xs font-medium leading-relaxed text-indigo-900">
        {tOr(
          'productDetail.commercePathContact',
          'Ask your question via chat before you order.',
          'Stel je vraag via de chat voordat je bestelt.',
        )}
      </p>
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-secondary-brand transition hover:border-secondary-brand/30 hover:bg-secondary-brand/5"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          {askLabel}
        </button>
      ) : (
        <MakerContactSection
          variant="product"
          makerId={product.seller?.User?.id ?? ''}
          makerName={sellerName}
          channels={publicContactChannels}
          productId={product.id}
          className="!border-gray-200 !bg-gray-50 text-gray-900 shadow-sm"
        />
      )}
    </div>
  );
}
