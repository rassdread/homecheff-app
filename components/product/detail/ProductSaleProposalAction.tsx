'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import MakerContactSection from '@/components/profile/MakerContactSection';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import { useTranslation } from '@/hooks/useTranslation';
import {
  EXCHANGE_FUNNEL_EVENTS,
  trackExchangeFunnelEvent,
  type ExchangeFunnelListingInput,
} from '@/lib/marketplace/exchange/exchange-funnel-analytics';
import { cn } from '@/lib/utils';

type Props = {
  productId: string;
  sellerId: string;
  sellerName: string;
  publicContactChannels: PublicContactChannel[];
  /** Primary CTA styling (barter-only listings). */
  primary?: boolean;
  className?: string;
  exchangeFunnelListing?: ExchangeFunnelListingInput;
};

export default function ProductSaleProposalAction({
  productId,
  sellerId,
  sellerName,
  publicContactChannels,
  primary = false,
  className,
  exchangeFunnelListing,
}: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(primary);

  if (!sellerId || publicContactChannels.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950',
          className,
        )}
      >
        {t('productDetail.contactNotConfigured')}
      </div>
    );
  }

  const label = t('marketplace.detail.actions.requestProposal');

  if (!primary && !expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          if (exchangeFunnelListing) {
            trackExchangeFunnelEvent(EXCHANGE_FUNNEL_EVENTS.proposalExpand, {
              ...exchangeFunnelListing,
              surface: 'commerce_zone',
              entrypoint: 'proposal_expand_click',
            });
          }
          setExpanded(true);
        }}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100',
          className,
        )}
      >
        <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <div id="commerce-proposal-cta" className={cn('space-y-2', className)}>
      <p
        className={cn(
          'rounded-xl border px-3 py-2 text-xs font-medium leading-relaxed',
          primary
            ? 'border-emerald-100 bg-emerald-50/80 text-emerald-900'
            : 'border-indigo-100 bg-indigo-50/80 text-indigo-900',
        )}
      >
        {t('productDetail.commercePathProposal')}
      </p>
      <MakerContactSection
        variant="product"
        makerId={sellerId}
        makerName={sellerName}
        channels={publicContactChannels}
        productId={productId}
        openProposalAfterStart
        chatButtonLabel={label}
        funnelListing={exchangeFunnelListing}
        funnelSurface="commerce_zone"
        funnelEntrypoint="commerce_proposal_deep_link"
        className={
          primary
            ? '!border-emerald-200 !bg-emerald-50/50 text-gray-900 shadow-sm'
            : '!border-gray-200 !bg-gray-50 text-gray-900 shadow-sm'
        }
      />
    </div>
  );
}
