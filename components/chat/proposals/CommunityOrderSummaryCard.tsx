'use client';

import Link from 'next/link';
import MarketplaceBadgeList from '@/components/marketplace/MarketplaceBadgeList';
import { useTranslation } from '@/hooks/useTranslation';
import { COMMUNITY_ORDER_I18N } from '@/lib/proposals/proposal-i18n-keys';
import {
  resolveAcceptedAlternativesLabelKey,
  resolveBuyerConsiderationLabelKey,
  resolveSellerTargetLabelKey,
} from '@/lib/proposals/proposal-barter-actor-labels';
import { getMarketplacePriceDisplay } from '@/lib/marketplace/price-display';
import type { ProposalNextAction } from '@/lib/proposals/proposal-accept-routing';
import { paymentPathFromSummary } from '@/lib/proposals/proposal-accept-routing';
import type { CommunityOrderDTO, ProposalDTO } from '@/lib/proposals/proposal-types';

type Props = {
  communityOrder: CommunityOrderDTO;
  proposal: ProposalDTO;
  nextAction?: ProposalNextAction;
  checkoutUrl?: string | null;
  currentUserId?: string;
};

export default function CommunityOrderSummaryCard({
  communityOrder,
  proposal,
  nextAction,
  checkoutUrl,
  currentUserId,
}: Props) {
  const { t } = useTranslation();

  const priceLabel = getMarketplacePriceDisplay(
    {
      priceCents: proposal.amountCents,
      priceModel:
        proposal.settlementMode === 'VOLUNTARY'
          ? 'VOLUNTARY'
          : proposal.settlementMode === 'VALUE_ONLY' ||
              proposal.settlementMode === 'FREE'
            ? 'ON_REQUEST'
            : 'FIXED',
      acceptedSpecializations: proposal.requestedValueTaxonomyIds,
    },
    t,
  );

  const paymentPath = paymentPathFromSummary(proposal.proposalSummary);
  const actors = {
    currentUserId: currentUserId ?? communityOrder.buyerId,
    buyerId: proposal.buyerId,
    sellerId: proposal.sellerId,
    createdById: proposal.createdById,
  };
  const buyerDeliversKey = resolveBuyerConsiderationLabelKey(actors, {
    asAgreement: true,
  });
  const sellerDeliversKey = resolveSellerTargetLabelKey({ asAgreement: true });
  const alternativesKey = resolveAcceptedAlternativesLabelKey();

  return (
    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900">
        {t(COMMUNITY_ORDER_I18N.heading)}
      </p>
      <p className="text-xs text-emerald-800">
        {t(COMMUNITY_ORDER_I18N.status[communityOrder.status])}
      </p>
      {paymentPath !== 'NONE' ? (
        <p className="text-[11px] text-emerald-800">
          {t(COMMUNITY_ORDER_I18N.paymentPath[paymentPath])}
        </p>
      ) : null}
      {communityOrder.fulfillmentMode ? (
        <p className="text-xs text-emerald-800">
          {t(COMMUNITY_ORDER_I18N.fulfillment[communityOrder.fulfillmentMode])}
        </p>
      ) : null}
      {communityOrder.deliveryRequested ? (
        <p className="text-[10px] text-emerald-700">
          {t(COMMUNITY_ORDER_I18N.deliveryRequested)}
          {communityOrder.deliveryAssigned
            ? ` · ${t(COMMUNITY_ORDER_I18N.deliveryAssigned)}`
            : ''}
        </p>
      ) : null}
      {nextAction === 'DELIVERY_REQUEST_CREATED' ? (
        <p className="text-[11px] text-emerald-800">
          {t(COMMUNITY_ORDER_I18N.delivery.requestCreated)}
        </p>
      ) : null}
      {nextAction === 'DELIVERY_REQUEST_READY' ? (
        <p className="text-[11px] text-emerald-800">
          {t(COMMUNITY_ORDER_I18N.delivery.requestReady)}
        </p>
      ) : null}
      {proposal.amountCents != null && proposal.amountCents > 0 ? (
        <p className="text-sm font-semibold text-emerald-900">{priceLabel}</p>
      ) : proposal.settlementMode !== 'MONEY' ? (
        <p className="text-sm font-semibold text-emerald-900">{priceLabel}</p>
      ) : null}
      <div className="space-y-0.5">
        <p className="text-[10px] font-medium text-emerald-800">
          {t(sellerDeliversKey)}
        </p>
        <p className="text-xs font-medium text-emerald-950">{proposal.title}</p>
      </div>
      {proposal.requestedValueTaxonomyIds.length > 0 ||
      (proposal.amountCents != null && proposal.amountCents > 0) ? (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-emerald-800">
            {t(buyerDeliversKey)}
          </p>
          {proposal.amountCents != null && proposal.amountCents > 0 ? (
            <p className="text-xs font-semibold text-emerald-900">{priceLabel}</p>
          ) : null}
          {proposal.requestedValueTaxonomyIds.length > 0 ? (
            <MarketplaceBadgeList
              specializations={proposal.requestedValueTaxonomyIds}
              variant="accepted"
              maxVisible={4}
              size="sm"
            />
          ) : null}
        </div>
      ) : null}
      {proposal.acceptedValueTaxonomyIds.length > 0 ? (
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-emerald-800">
            {t(alternativesKey)}
          </p>
          <MarketplaceBadgeList
            specializations={proposal.acceptedValueTaxonomyIds}
            variant="accepted"
            maxVisible={4}
            size="sm"
          />
        </div>
      ) : null}
      {nextAction === 'CHECKOUT_REQUIRED' && checkoutUrl ? (
        <Link
          href={checkoutUrl}
          className="inline-block text-xs font-semibold text-emerald-900 underline"
        >
          {t('proposal.nextAction.checkoutCta')}
        </Link>
      ) : null}
    </div>
  );
}
