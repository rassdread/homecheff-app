'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Star,
  Truck,
} from 'lucide-react';
import MarketplaceBadgeList from '@/components/marketplace/MarketplaceBadgeList';
import { useTranslation } from '@/hooks/useTranslation';
import { resolveDealUxState, type DealPrimaryCtaKind } from '@/lib/proposals/deal-ux-state';
import { paymentPathFromSummary } from '@/lib/proposals/proposal-accept-routing';
import { DEAL_I18N, DEAL_COMMITMENT_I18N, PROPOSAL_I18N } from '@/lib/proposals/proposal-i18n-keys';
import { getMarketplacePriceDisplay } from '@/lib/marketplace/price-display';
import type { DeliveryRequestDTO } from '@/lib/delivery/delivery-marketplace-types';
import type { CommunityOrderDTO, ProposalDTO } from '@/lib/proposals/proposal-types';

type Props = {
  communityOrder: CommunityOrderDTO;
  proposal: ProposalDTO;
  deliveryRequest?: DeliveryRequestDTO | null;
  onDeliveryRequestCreated?: (deliveryRequest: DeliveryRequestDTO) => void;
  onCommunityOrderUpdated?: (order: CommunityOrderDTO) => void;
};

function ctaIcon(kind: DealPrimaryCtaKind) {
  switch (kind) {
    case 'PAY_CHECKOUT':
      return CreditCard;
    case 'DISCUSS_PAYMENT':
      return MessageCircle;
    case 'MARK_COMPLETE':
      return CheckCircle2;
    case 'REQUEST_DELIVERY':
    case 'VIEW_DELIVERY':
    case 'REVIEW_DELIVERY':
      return Truck;
    case 'REVIEW_DEAL':
      return Star;
    case 'COMPLETE':
      return CheckCircle2;
    default:
      return CheckCircle2;
  }
}

export default function DealCard({
  communityOrder,
  proposal,
  deliveryRequest,
  onDeliveryRequestCreated,
  onCommunityOrderUpdated,
}: Props) {
  const { t } = useTranslation();
  const [order, setOrder] = useState(communityOrder);
  const [canReviewDeal, setCanReviewDeal] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);

  useEffect(() => {
    setOrder(communityOrder);
  }, [communityOrder]);

  useEffect(() => {
    if (order.status !== 'COMPLETED') {
      setCanReviewDeal(false);
      return;
    }
    void fetch(`/api/community-orders/${order.id}/deal-review`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.canReview) setCanReviewDeal(true);
      })
      .catch(() => undefined);
  }, [order.id, order.status]);

  const deal = resolveDealUxState({
    proposal,
    communityOrder: order,
    deliveryRequest,
    canReviewDeal,
  });
  const paymentPath = paymentPathFromSummary(proposal.proposalSummary);

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

  const requestDelivery = useCallback(async () => {
    setActionError(null);
    setActionBusy(true);
    try {
      const res = await fetch(
        `/api/community-orders/${order.id}/delivery-request`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      );
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.errorKey === 'string'
            ? data.errorKey
            : typeof data.error === 'string' && data.error.startsWith('delivery.')
              ? data.error
              : null;
        setActionError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      if (data.deliveryRequest) {
        onDeliveryRequestCreated?.(data.deliveryRequest);
        setShowDeliveryDetails(true);
      }
    } catch {
      setActionError(t('common.error'));
    } finally {
      setActionBusy(false);
    }
  }, [order.id, onDeliveryRequestCreated, t]);

  const markComplete = useCallback(async () => {
    setActionError(null);
    setActionBusy(true);
    try {
      const res = await fetch(`/api/community-orders/${order.id}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.errorKey === 'string' ? data.errorKey : null;
        setActionError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      if (data.communityOrder) {
        setOrder(data.communityOrder);
        onCommunityOrderUpdated?.(data.communityOrder);
        if (data.communityOrder.status === 'COMPLETED') {
          setCanReviewDeal(true);
        }
      }
    } catch {
      setActionError(t('common.error'));
    } finally {
      setActionBusy(false);
    }
  }, [order.id, onCommunityOrderUpdated, t]);

  const CtaIcon = ctaIcon(deal.primaryCta.kind);
  const isCompleteCta = deal.primaryCta.kind === 'COMPLETE';

  const handlePrimaryClick = () => {
    if (deal.primaryCta.kind === 'REQUEST_DELIVERY') {
      void requestDelivery();
      return;
    }
    if (deal.primaryCta.kind === 'MARK_COMPLETE') {
      void markComplete();
      return;
    }
    if (deal.primaryCta.kind === 'VIEW_DELIVERY') {
      setShowDeliveryDetails((v) => !v);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900">
          {t(DEAL_I18N.heading)}
        </p>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
          {t(deal.statusLabelKey)}
        </span>
      </div>

      <p className="text-sm font-semibold text-emerald-950">{proposal.title}</p>

      {(proposal.amountCents != null && proposal.amountCents > 0) ||
      proposal.settlementMode !== 'MONEY' ? (
        <p className="text-sm font-semibold text-emerald-900">{priceLabel}</p>
      ) : null}

      {proposal.acceptedValueTaxonomyIds.length > 0 ? (
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-emerald-800">
            {t(PROPOSAL_I18N.acceptsLabel)}
          </p>
          <MarketplaceBadgeList
            specializations={proposal.acceptedValueTaxonomyIds}
            variant="accepted"
            maxVisible={4}
            size="sm"
          />
        </div>
      ) : null}

      {proposal.requestedValueTaxonomyIds.length > 0 ? (
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-emerald-800">
            {t(PROPOSAL_I18N.seeksLabel)}
          </p>
          <MarketplaceBadgeList
            specializations={proposal.requestedValueTaxonomyIds}
            variant="accepted"
            maxVisible={4}
            size="sm"
          />
        </div>
      ) : null}

      {paymentPath !== 'NONE' ? (
        <p className="text-[11px] text-emerald-800">
          <span className="font-medium">{t(DEAL_I18N.paymentHeading)}: </span>
          {t(DEAL_I18N.paymentPath[paymentPath])}
        </p>
      ) : null}

      {paymentPath === 'DIRECT_CONTACT' ? (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
          {t(DEAL_COMMITMENT_I18N.directRisk)}
        </p>
      ) : null}

      {paymentPath === 'HOMECHEFF_CHECKOUT' && deal.showPaymentRequired ? (
        <p className="text-[11px] text-indigo-800">
          {t(DEAL_COMMITMENT_I18N.homecheffHint)}
        </p>
      ) : null}

      {order.fulfillmentMode ? (
        <p className="text-xs text-emerald-800">
          {t(DEAL_I18N.fulfillment[order.fulfillmentMode])}
        </p>
      ) : null}

      {order.deliveryRequested ? (
        <p className="text-[10px] text-emerald-700">
          {deliveryRequest
            ? deliveryRequest.status === 'COMPLETED'
              ? t(`delivery.request.status.${deliveryRequest.status.toLowerCase()}`)
              : deliveryRequest.activeAssignment?.status === 'ACCEPTED'
                ? t(DEAL_I18N.delivery.inProgress)
                : t(DEAL_I18N.delivery.statusActive)
            : t(DEAL_I18N.delivery.statusPending)}
          {deliveryRequest?.courierName
            ? ` · ${t(DEAL_I18N.delivery.courierName, { name: deliveryRequest.courierName })}`
            : order.deliveryAssigned || deliveryRequest?.activeAssignment
              ? ` · ${t(DEAL_I18N.delivery.courierAssigned)}`
              : ''}
        </p>
      ) : null}

      <div className="rounded-lg border border-emerald-300/60 bg-white/70 px-2.5 py-2 space-y-2">
        <p className="text-[11px] text-emerald-800">{t(deal.nextStepHintKey)}</p>
        {deal.primaryCta.href ? (
          <Link
            href={deal.primaryCta.href}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <CtaIcon className="h-4 w-4 shrink-0" aria-hidden />
            {t(deal.primaryCta.labelKey)}
          </Link>
        ) : isCompleteCta ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900">
            <CtaIcon className="h-4 w-4 shrink-0" aria-hidden />
            {t(deal.primaryCta.labelKey)}
          </div>
        ) : (
          <button
            type="button"
            disabled={actionBusy}
            onClick={handlePrimaryClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {actionBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CtaIcon className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {t(deal.primaryCta.labelKey)}
          </button>
        )}
      </div>

      {showDeliveryDetails && deliveryRequest ? (
        <div className="rounded-lg border border-emerald-200 bg-white/90 p-2 text-[11px] text-emerald-900 space-y-1">
          <p className="font-semibold">{t(DEAL_I18N.delivery.detailsHeading)}</p>
          <p>{t(`delivery.request.status.${deliveryRequest.status.toLowerCase()}`)}</p>
          {deliveryRequest.deliveryAddress ? (
            <p>{deliveryRequest.deliveryAddress}</p>
          ) : null}
          {deliveryRequest.activeAssignment ? (
            <p>
              {deliveryRequest.courierName
                ? t(DEAL_I18N.delivery.courierName, {
                    name: deliveryRequest.courierName,
                  })
                : t(DEAL_I18N.delivery.courierAssigned)}
            </p>
          ) : null}
        </div>
      ) : null}

      {actionError ? (
        <p className="text-[11px] text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
