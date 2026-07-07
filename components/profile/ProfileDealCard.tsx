'use client';

import { useCallback, useState } from 'react';
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
import type { DealPrimaryCtaKind } from '@/lib/proposals/deal-ux-state';
import {
  DEAL_COMMITMENT_I18N,
  DEAL_I18N,
  PROFILE_DEALS_I18N,
  PROPOSAL_I18N,
} from '@/lib/proposals/proposal-i18n-keys';
import type { ProfileDealDTO } from '@/lib/proposals/profile-deal-types';
import { getMarketplacePriceDisplay } from '@/lib/marketplace/price-display';

type Props = {
  deal: ProfileDealDTO;
  onUpdated: (deal: ProfileDealDTO) => void;
  as?: 'li' | 'div';
};

function ctaIcon(kind: DealPrimaryCtaKind) {
  switch (kind) {
    case 'PAY_CHECKOUT':
      return CreditCard;
    case 'DISCUSS_PAYMENT':
      return MessageCircle;
    case 'MARK_COMPLETE':
    case 'COMPLETE':
      return CheckCircle2;
    case 'REQUEST_DELIVERY':
    case 'VIEW_DELIVERY':
    case 'REVIEW_DELIVERY':
      return Truck;
    case 'REVIEW_DEAL':
      return Star;
    default:
      return CheckCircle2;
  }
}

function blockToneClass(tone: string): string {
  switch (tone) {
    case 'success':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'warning':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'info':
      return 'bg-sky-50 text-sky-900 border-sky-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function statusLabel(
  t: (key: string, params?: Record<string, string>) => string,
  block: ProfileDealDTO['statusBlocks'][number],
  courierName: string | null,
): string {
  if (
    courierName &&
    (block.labelKey === PROFILE_DEALS_I18N.status.delivery.courierAssignedNamed ||
      block.labelKey === PROFILE_DEALS_I18N.status.delivery.inProgressNamed)
  ) {
    return t(block.labelKey, { name: courierName });
  }
  return t(block.labelKey);
}

export default function ProfileDealCard({ deal, onUpdated, as = 'li' }: Props) {
  const { t } = useTranslation();
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);

  const priceLabel = getMarketplacePriceDisplay(
    {
      priceCents: deal.amountCents,
      priceModel:
        deal.settlementMode === 'VOLUNTARY'
          ? 'VOLUNTARY'
          : deal.settlementMode === 'VALUE_ONLY' || deal.settlementMode === 'FREE'
            ? 'ON_REQUEST'
            : 'FIXED',
      acceptedSpecializations: deal.requestedValueTaxonomyIds,
    },
    t,
  );

  const refreshDeal = useCallback(async () => {
    const res = await fetch('/api/profile/deals');
    if (!res.ok) return;
    const data = await res.json();
    const updated = (data.deals as ProfileDealDTO[] | undefined)?.find(
      (row) => row.id === deal.id,
    );
    if (updated) onUpdated(updated);
  }, [deal.id, onUpdated]);

  const requestDelivery = useCallback(async () => {
    setActionError(null);
    setActionBusy(true);
    try {
      const res = await fetch(
        `/api/community-orders/${deal.id}/delivery-request`,
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
      await refreshDeal();
      setShowDeliveryDetails(true);
    } catch {
      setActionError(t('common.error'));
    } finally {
      setActionBusy(false);
    }
  }, [deal.id, refreshDeal, t]);

  const markComplete = useCallback(async () => {
    setActionError(null);
    setActionBusy(true);
    try {
      const res = await fetch(`/api/community-orders/${deal.id}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.errorKey === 'string' ? data.errorKey : null;
        setActionError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      await refreshDeal();
    } catch {
      setActionError(t('common.error'));
    } finally {
      setActionBusy(false);
    }
  }, [deal.id, refreshDeal, t]);

  const cancelOrder = useCallback(async () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(t(PROFILE_DEALS_I18N.cancelConfirm))
    ) {
      return;
    }
    setActionError(null);
    setActionBusy(true);
    try {
      const res = await fetch(`/api/community-orders/${deal.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.errorKey === 'string' ? data.errorKey : null;
        setActionError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      await refreshDeal();
    } catch {
      setActionError(t('common.error'));
    } finally {
      setActionBusy(false);
    }
  }, [deal.id, refreshDeal, t]);

  const ux = deal.dealUx;
  const CtaIcon = ctaIcon(ux.primaryCta.kind);
  const paymentPath = deal.paymentPath;

  const handlePrimaryClick = () => {
    if (ux.primaryCta.kind === 'REQUEST_DELIVERY') {
      void requestDelivery();
      return;
    }
    if (ux.primaryCta.kind === 'MARK_COMPLETE') {
      void markComplete();
      return;
    }
    if (ux.primaryCta.kind === 'VIEW_DELIVERY') {
      setShowDeliveryDetails((v) => !v);
    }
  };

  const Wrapper = as === 'div' ? 'div' : 'li';

  return (
    <Wrapper className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-semibold text-gray-900">{deal.proposalTitle}</p>
          {deal.counterpartName ? (
            <p className="text-xs text-gray-600">
              {t('trust.deals.with', { name: deal.counterpartName })}
            </p>
          ) : null}
          <p className="text-[10px] text-gray-500">
            {t(
              deal.userRoleInDeal === 'BUYER'
                ? PROFILE_DEALS_I18N.role.buyer
                : PROFILE_DEALS_I18N.role.seller,
            )}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
          {t(`communityOrder.status.${deal.status.toLowerCase()}`)}
        </span>
      </div>

      {(deal.amountCents != null && deal.amountCents > 0) ||
      deal.settlementMode !== 'MONEY' ? (
        <p className="text-sm font-semibold text-gray-900">{priceLabel}</p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {deal.statusBlocks.map((block) => (
          <span
            key={`${block.kind}-${block.labelKey}`}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${blockToneClass(block.tone)}`}
          >
            <span className="opacity-70">
              {t(PROFILE_DEALS_I18N.blocks[block.kind])}:{' '}
            </span>
            {statusLabel(t, block, deal.courierName)}
          </span>
        ))}
      </div>

      {deal.acceptedValueTaxonomyIds.length > 0 ? (
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-gray-600">
            {t(PROPOSAL_I18N.acceptsLabel)}
          </p>
          <MarketplaceBadgeList
            specializations={deal.acceptedValueTaxonomyIds}
            variant="accepted"
            maxVisible={4}
            size="sm"
          />
        </div>
      ) : null}

      {paymentPath && paymentPath !== 'NONE' ? (
        <p className="text-[11px] text-gray-700">
          <span className="font-medium">{t(DEAL_I18N.paymentHeading)}: </span>
          {t(DEAL_I18N.paymentPath[paymentPath])}
        </p>
      ) : null}

      {paymentPath === 'DIRECT_CONTACT' ? (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
          {t(DEAL_COMMITMENT_I18N.directRisk)}
        </p>
      ) : null}

      {deal.deliveryRequired ? (
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 space-y-1.5 text-[11px] text-gray-800">
          <p className="font-semibold text-gray-900">
            {t(PROFILE_DEALS_I18N.delivery.sectionHeading)}
          </p>
          {deal.pickupLabel ? (
            <p>{t(PROFILE_DEALS_I18N.delivery.pickup, { label: deal.pickupLabel })}</p>
          ) : null}
          {deal.dropoffLabel ? (
            <p>{t(PROFILE_DEALS_I18N.delivery.dropoff, { label: deal.dropoffLabel })}</p>
          ) : null}
          {deal.requestedWindowLabel ? (
            <p>
              {t(PROFILE_DEALS_I18N.delivery.window, {
                label: deal.requestedWindowLabel,
              })}
            </p>
          ) : null}
          {deal.courierName ? (
            <p>{t(DEAL_I18N.delivery.courierName, { name: deal.courierName })}</p>
          ) : null}
        </div>
      ) : null}

      {showDeliveryDetails && deal.deliveryRequest ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2 text-[11px] text-emerald-900 space-y-1">
          <p className="font-semibold">{t(DEAL_I18N.delivery.detailsHeading)}</p>
          <p>
            {t(
              `delivery.request.status.${deal.deliveryRequest.status.toLowerCase()}`,
            )}
          </p>
          {deal.deliveryRequest.deliveryAddress ? (
            <p>{deal.deliveryRequest.deliveryAddress}</p>
          ) : null}
        </div>
      ) : null}

      {deal.status === 'OPEN' ? (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 px-2.5 py-2 space-y-2">
          <p className="text-[11px] text-emerald-900">{t(ux.nextStepHintKey)}</p>
          {ux.primaryCta.href ? (
            <Link
              href={ux.primaryCta.href}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CtaIcon className="h-4 w-4 shrink-0" aria-hidden />
              {t(ux.primaryCta.labelKey)}
            </Link>
          ) : ux.primaryCta.kind === 'COMPLETE' ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900">
              <CtaIcon className="h-4 w-4 shrink-0" aria-hidden />
              {t(ux.primaryCta.labelKey)}
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
              {t(ux.primaryCta.labelKey)}
            </button>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/messages/${deal.conversationId}`}
          className="text-xs font-semibold text-emerald-700 underline"
        >
          {t(PROFILE_DEALS_I18N.actions.openChat)}
        </Link>
        {deal.canReview ? (
          <Link
            href={`/deal-review/${deal.id}`}
            className="text-xs font-semibold text-emerald-700 underline"
          >
            {t(PROFILE_DEALS_I18N.actions.reviewDeal)}
          </Link>
        ) : null}
        {ux.primaryCta.kind === 'REVIEW_DELIVERY' && ux.primaryCta.href ? (
          <Link
            href={ux.primaryCta.href}
            className="text-xs font-semibold text-emerald-700 underline"
          >
            {t(PROFILE_DEALS_I18N.actions.reviewDelivery)}
          </Link>
        ) : null}
        {deal.status === 'OPEN' ? (
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => void cancelOrder()}
            className="text-xs font-semibold text-red-600 underline hover:text-red-700 disabled:opacity-50"
          >
            {t(PROFILE_DEALS_I18N.actions.cancel)}
          </button>
        ) : null}
      </div>

      {actionError ? (
        <p className="text-[11px] text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}
    </Wrapper>
  );
}
