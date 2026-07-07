'use client';

import MarketplaceBadgeList from '@/components/marketplace/MarketplaceBadgeList';
import { useTranslation } from '@/hooks/useTranslation';
import { PROPOSAL_POLISH_I18N, PROPOSAL_I18N } from '@/lib/proposals/proposal-i18n-keys';
import type { ProposalFormValues } from '@/lib/proposals/proposal-form-types';
import type { ProposalPaymentPath } from '@/lib/proposals/proposal-product-binding';

type Props = {
  form: ProposalFormValues;
  offerLabel?: string | null;
  showPaymentPath?: boolean;
};

export default function ProposalSummaryPreview({
  form,
  offerLabel,
  showPaymentPath = false,
}: Props) {
  const { t } = useTranslation();

  const showMoney =
    form.settlementMode === 'MONEY' || form.settlementMode === 'MONEY_AND_VALUE';
  const showValue =
    form.settlementMode === 'VALUE_ONLY' ||
    form.settlementMode === 'MONEY_AND_VALUE' ||
    form.settlementMode === 'FREE' ||
    form.settlementMode === 'VOLUNTARY';

  const paymentPathLabel =
    showPaymentPath && form.paymentPath !== 'NONE'
      ? t(PROPOSAL_I18N.paymentPath[form.paymentPath as ProposalPaymentPath])
      : null;

  const fulfillmentLabel =
    form.fulfillmentType === 'DELIVERY'
      ? t('deal.fulfillment.delivery')
      : form.fulfillmentType === 'PICKUP'
        ? t('deal.fulfillment.pickup')
        : null;

  const conditions: string[] = [];
  if (form.requestedTimeWindow.trim()) {
    conditions.push(form.requestedTimeWindow.trim());
  }
  if (form.requestedDate) {
    conditions.push(form.requestedDate);
  }
  if (fulfillmentLabel) {
    conditions.push(fulfillmentLabel);
  }

  return (
    <div
      className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2 text-xs text-gray-800"
      data-testid="proposal-summary-preview"
    >
      <p className="font-semibold text-indigo-900">
        {t(PROPOSAL_POLISH_I18N.summary.heading)}
      </p>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {t(PROPOSAL_POLISH_I18N.summary.offer)}
        </p>
        <p className="font-medium text-gray-900">
          {offerLabel ?? (form.title || '—')}
        </p>
        {showMoney && form.amountEuros.trim() ? (
          <p className="text-gray-700">€ {form.amountEuros.trim()}</p>
        ) : null}
      </div>

      {showValue && form.requestedValueTaxonomyIds.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {t(PROPOSAL_POLISH_I18N.summary.counterOffer)}
          </p>
          <MarketplaceBadgeList
            specializations={form.requestedValueTaxonomyIds}
            variant="accepted"
            maxVisible={6}
            size="sm"
          />
        </div>
      ) : null}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {t(PROPOSAL_POLISH_I18N.summary.payment)}
        </p>
        <p className="font-medium text-gray-900">
          {t(PROPOSAL_I18N.settlement[form.settlementMode])}
        </p>
        {paymentPathLabel ? (
          <p className="text-gray-600">{paymentPathLabel}</p>
        ) : null}
      </div>

      {conditions.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {t(PROPOSAL_POLISH_I18N.summary.conditions)}
          </p>
          <p className="text-gray-700">{conditions.join(' · ')}</p>
        </div>
      ) : null}
    </div>
  );
}
