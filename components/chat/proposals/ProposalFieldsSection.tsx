'use client';

import type { SettlementMode } from '@prisma/client';
import AcceptedValuesPicker from '@/components/products/marketplace/AcceptedValuesPicker';
import BarterOfferImageUploader from '@/components/chat/proposals/BarterOfferImageUploader';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DEAL_COMMITMENT_I18N,
  PROPOSAL_I18N,
  PROPOSAL_POLISH_I18N,
} from '@/lib/proposals/proposal-i18n-keys';
import type { ProposalFormValues } from '@/lib/proposals/proposal-form-types';
import type { ProposalPaymentPath } from '@/lib/proposals/proposal-product-binding';
import { allowedFulfillmentTypes } from '@/lib/proposals/proposal-fulfillment-utils';
import type { FulfillmentOptions } from '@/lib/marketplace/listing-taxonomy';
import {
  canProposalHomeCheffCheckout,
  parseProposalAmountEurosToCents,
  proposalHomeCheffCheckoutBlockedReason,
} from '@/lib/proposals/proposal-homecheff-eligibility';
import { sellerBarterPreferenceHintKey } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import { proposalNegotiationIgnoresStockAvailability } from '@/lib/proposals/proposal-stock-policy';

export type ProposalFieldsProduct = {
  id: string;
  title: string;
  priceCents: number | null;
  availableStock: number | null;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  /** Seller eligible once amount > 0 (Connect + HC opt-in). */
  canHomeCheffCheckout: boolean;
  sellerStripeReady?: boolean;
  homeCheffCheckoutBlockedReason?: string | null;
  fulfillmentOptions?: FulfillmentOptions;
  delivery?: string | null;
  barterOpenness?: string | null;
  priceModel?: string | null;
  marketplaceCategory?: string | null;
};

type Props = {
  form: ProposalFormValues;
  onChange: (next: ProposalFormValues) => void;
  allowedSettlementModes: SettlementMode[];
  product?: ProposalFieldsProduct | null;
  idPrefix?: string;
  /** Actor-aware barter picker heading (buyer offers vs seller asks). */
  valuePickerHeadingKey?: string;
  /**
   * When true (default if product is set), hide the editable title field —
   * listing identity comes from the product summary, not a free-text title.
   */
  lockListingTitle?: boolean;
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
  valuePickerHeadingKey = 'marketplace.acceptedValues.offeredInReturnHeading',
  lockListingTitle,
}: Props) {
  const { t } = useTranslation();
  const titleLocked = lockListingTitle ?? Boolean(product);

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

  const fulfillmentOptions = product?.fulfillmentOptions
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

  const amountCents = showMoneyField
    ? parseProposalAmountEurosToCents(form.amountEuros)
    : null;
  const sellerStripeReady =
    product?.sellerStripeReady ?? Boolean(product?.canHomeCheffCheckout);
  const canSelectHomeCheff = Boolean(
    product &&
      canProposalHomeCheffCheckout({
        acceptHomeCheffPayment: product.acceptHomeCheffPayment,
        sellerStripeReady,
        settlementMode: form.settlementMode,
        amountCents,
      }),
  );
  const homeCheffDisabledReason =
    product && showMoneyField && product.acceptHomeCheffPayment && !canSelectHomeCheff
      ? proposalHomeCheffCheckoutBlockedReason({
          acceptHomeCheffPayment: product.acceptHomeCheffPayment,
          sellerStripeReady,
          settlementMode: form.settlementMode,
          amountCents,
        })
      : null;

  const showHomecheffRecommended =
    canSelectHomeCheff && product?.acceptHomeCheffPayment;
  const ignoreStockCap =
    product != null &&
    proposalNegotiationIgnoresStockAvailability({
      priceModel: product.priceModel,
      marketplaceCategory: product.marketplaceCategory,
      fulfillmentOptions:
        product.fulfillmentOptions &&
        typeof product.fulfillmentOptions === 'object'
          ? product.fulfillmentOptions
          : null,
    });
  const maxQuantity =
    ignoreStockCap || product?.availableStock == null
      ? undefined
      : product.availableStock;
  const preferenceKey = product
    ? sellerBarterPreferenceHintKey(product.barterOpenness)
    : null;

  const onSettlementChange = (mode: SettlementMode) => {
    const next: ProposalFormValues = { ...form, settlementMode: mode };
    const valueLeg = mode === 'VALUE_ONLY' || mode === 'MONEY_AND_VALUE';
    if (!valueLeg) {
      next.requestedValueTaxonomyIds = [];
      next.barterOfferImageUrls = [];
    }
    if (mode !== 'MONEY' && mode !== 'MONEY_AND_VALUE') {
      next.paymentPath = 'NONE';
      next.amountEuros = '';
    }
    onChange(next);
  };

  // Keep paymentPath coherent when amount enables/disables HomeCheff.
  const onAmountChange = (value: string) => {
    const nextCents = parseProposalAmountEurosToCents(value);
    const next = { ...form, amountEuros: value };
    if (
      !product ||
      (form.settlementMode !== 'MONEY' &&
        form.settlementMode !== 'MONEY_AND_VALUE')
    ) {
      onChange(next);
      return;
    }
    const eligible = canProposalHomeCheffCheckout({
      acceptHomeCheffPayment: product.acceptHomeCheffPayment,
      sellerStripeReady,
      settlementMode: form.settlementMode,
      amountCents: nextCents,
    });
    if (eligible && form.paymentPath !== 'HOMECHEFF_CHECKOUT') {
      next.paymentPath = 'HOMECHEFF_CHECKOUT';
    } else if (!eligible && form.paymentPath === 'HOMECHEFF_CHECKOUT') {
      next.paymentPath = product.acceptDirectContact
        ? 'DIRECT_CONTACT'
        : 'NONE';
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-900 mb-2">
          {t('proposal.offerHeading')}
        </p>
        <p className="text-[11px] text-gray-500 mb-2">
          {t(PROPOSAL_POLISH_I18N.counter.settlementHint)}
        </p>
        {preferenceKey ? (
          <p className="text-[11px] text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-2 mb-2">
            {t(preferenceKey)}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {allowedSettlementModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSettlementChange(mode)}
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

      {!titleLocked ? (
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
      ) : null}

      <div>
        <label
          htmlFor={`${idPrefix}-description`}
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          {t('proposal.fields.messageLabel')}
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={set('description')}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
          placeholder={t('proposal.fields.messagePlaceholder')}
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
              onChange={(e) => onAmountChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ) : null}
      </div>

      {showValuePicker ? (
        <div className="space-y-3">
          <AcceptedValuesPicker
            value={form.requestedValueTaxonomyIds}
            onChange={(ids) =>
              onChange({ ...form, requestedValueTaxonomyIds: ids })
            }
            headingKey={valuePickerHeadingKey}
          />
          <BarterOfferImageUploader
            value={form.barterOfferImageUrls}
            onChange={(barterOfferImageUrls) =>
              onChange({ ...form, barterOfferImageUrls })
            }
            idPrefix={idPrefix}
          />
        </div>
      ) : null}

      {showPaymentPath ? (
        <div>
          <p className="text-xs font-semibold text-gray-900 mb-2">
            {t(PROPOSAL_POLISH_I18N.summary.moneyPayment)}
          </p>
          {showHomecheffRecommended ? (
            <p className="text-[11px] text-indigo-700 mb-2">
              {t(DEAL_COMMITMENT_I18N.homecheffHint)}
            </p>
          ) : null}
          {homeCheffDisabledReason ? (
            <p className="text-[11px] text-amber-800 mb-2">
              {t(homeCheffDisabledReason)}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {availablePaymentPaths.map((path) => {
              const disabled =
                path === 'HOMECHEFF_CHECKOUT' && !canSelectHomeCheff;
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
