'use client';

import type { SettlementMode } from '@prisma/client';
import AcceptedValuesPicker from '@/components/products/marketplace/AcceptedValuesPicker';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DEAL_COMMITMENT_I18N,
  PROPOSAL_I18N,
  PROPOSAL_POLISH_I18N,
} from '@/lib/proposals/proposal-i18n-keys';
import type { ProposalFormValues } from '@/lib/proposals/proposal-form-types';
import type { ProposalPaymentPath } from '@/lib/proposals/proposal-product-binding';
import { allowedFulfillmentTypes } from '@/lib/proposals/proposal-fulfillment-utils';

export type ProposalFieldsProduct = {
  id: string;
  title: string;
  priceCents: number | null;
  availableStock: number | null;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  canHomeCheffCheckout: boolean;
  homeCheffCheckoutBlockedReason?: string | null;
  fulfillmentOptions?: string | null;
  delivery?: string | null;
};

type Props = {
  form: ProposalFormValues;
  onChange: (next: ProposalFormValues) => void;
  allowedSettlementModes: SettlementMode[];
  product?: ProposalFieldsProduct | null;
  idPrefix?: string;
};

const PAYMENT_PATHS: ProposalPaymentPath[] = [
  'HOMECHEFF_CHECKOUT',
  'DIRECT_CONTACT',
  'NONE',
];

export default function ProposalFieldsSection({
  form,
  onChange,
  allowedSettlementModes,
  product,
  idPrefix = 'proposal',
}: Props) {
  const { t } = useTranslation();

  const set =
    (key: keyof ProposalFormValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      onChange({ ...form, [key]: e.target.value });
    };

  const showMoneyField =
    form.settlementMode === 'MONEY' || form.settlementMode === 'MONEY_AND_VALUE';
  const showValuePicker =
    form.settlementMode === 'VALUE_ONLY' ||
    form.settlementMode === 'MONEY_AND_VALUE';
  const showPaymentPath = showMoneyField && Boolean(product);

  const fulfillmentOptions = product
    ? allowedFulfillmentTypes(product.fulfillmentOptions)
    : (['PICKUP', 'DELIVERY'] as const);

  const availablePaymentPaths = PAYMENT_PATHS.filter((path) => {
    if (!product) return false;
    if (path === 'HOMECHEFF_CHECKOUT') return product.acceptHomeCheffPayment;
    if (path === 'DIRECT_CONTACT') return product.acceptDirectContact;
    return false;
  }).sort((a, b) => {
    if (a === 'HOMECHEFF_CHECKOUT') return -1;
    if (b === 'HOMECHEFF_CHECKOUT') return 1;
    return 0;
  });

  const showHomecheffRecommended =
    product?.canHomeCheffCheckout && product?.acceptHomeCheffPayment;
  const maxQuantity = product?.availableStock ?? undefined;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-900 mb-2">
          {t(PROPOSAL_I18N.settlementHeading)}
        </p>
        <p className="text-[11px] text-gray-500 mb-2">
          {t(PROPOSAL_POLISH_I18N.counter.settlementHint)}
        </p>
        <div className="flex flex-wrap gap-2">
          {allowedSettlementModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...form, settlementMode: mode })}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                form.settlementMode === mode
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-gray-200 text-gray-700'
              }`}
            >
              {t(PROPOSAL_I18N.settlement[mode])}
            </button>
          ))}
        </div>
      </div>

      {showPaymentPath ? (
        <div>
          <p className="text-xs font-semibold text-gray-900 mb-2">
            {t('deal.paymentHeading')}
          </p>
          {showHomecheffRecommended ? (
            <p className="text-[11px] text-indigo-700 mb-2">
              {t(DEAL_COMMITMENT_I18N.homecheffHint)}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {availablePaymentPaths.map((path) => {
              const disabled =
                path === 'HOMECHEFF_CHECKOUT' && !product?.canHomeCheffCheckout;
              return (
                <button
                  key={path}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ ...form, paymentPath: path })}
                  className={`rounded-lg border px-3 py-2 text-left text-xs ${
                    form.paymentPath === path
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 text-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {t(PROPOSAL_I18N.paymentPath[path])}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <label
          htmlFor={`${idPrefix}-title`}
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          {t('marketplace.form.titleLabel')}
        </label>
        <input
          id={`${idPrefix}-title`}
          required
          value={form.title}
          onChange={set('title')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-description`}
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          {t('marketplace.form.descriptionLabel')}
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={set('description')}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${idPrefix}-quantity`}
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            {t('productOrder.quantityLabel')}
          </label>
          <input
            id={`${idPrefix}-quantity`}
            type="number"
            min={1}
            max={maxQuantity}
            value={form.quantity}
            onChange={set('quantity')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        {showMoneyField ? (
          <div>
            <label
              htmlFor={`${idPrefix}-amount`}
              className="mb-1 block text-xs font-medium text-gray-700"
            >
              {t('marketplace.form.priceLabel')}
            </label>
            <input
              id={`${idPrefix}-amount`}
              inputMode="decimal"
              value={form.amountEuros}
              onChange={set('amountEuros')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ) : null}
      </div>

      {showValuePicker ? (
        <AcceptedValuesPicker
          value={form.requestedValueTaxonomyIds}
          onChange={(ids) =>
            onChange({ ...form, requestedValueTaxonomyIds: ids })
          }
          headingKey="marketplace.acceptedValues.offeredInReturnHeading"
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${idPrefix}-date`}
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            {t('marketplace.form.dateLabel', { defaultValue: 'Datum' })}
          </label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={form.requestedDate}
            onChange={set('requestedDate')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-time`}
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            {t('marketplace.form.timeLabel', { defaultValue: 'Tijd' })}
          </label>
          <input
            id={`${idPrefix}-time`}
            value={form.requestedTimeWindow}
            onChange={set('requestedTimeWindow')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="18:00"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-fulfillment`}
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          {t('marketplace.fulfillment.heading')}
        </label>
        <select
          id={`${idPrefix}-fulfillment`}
          value={form.fulfillmentType}
          onChange={set('fulfillmentType')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">—</option>
          {fulfillmentOptions.includes('PICKUP') ? (
            <option value="PICKUP">{t('marketplace.fulfillment.pickup')}</option>
          ) : null}
          {fulfillmentOptions.includes('DELIVERY') ? (
            <option value="DELIVERY">
              {t('marketplace.fulfillment.delivery')}
            </option>
          ) : null}
        </select>
      </div>
    </div>
  );
}
