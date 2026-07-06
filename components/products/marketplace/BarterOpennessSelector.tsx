'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { PAYMENT_METHOD_REGISTRY } from '@/lib/marketplace/value-exchange/payment-methods';
import type { BarterOpennessValue } from '@/lib/marketplace/resolve-barter-openness-for-save';
import { BARTER_OPENNESS_VALUES } from '@/lib/marketplace/resolve-barter-openness-for-save';
import { valueExchangeSectionTitleKey } from '@/lib/marketplace/detail/detail-value-exchange-block';

const OPTION_REGISTRY: Record<
  BarterOpennessValue,
  keyof typeof PAYMENT_METHOD_REGISTRY
> = {
  MONEY: 'MONEY',
  MONEY_AND_BARTER: 'MONEY_AND_BARTER',
  BARTER_ONLY: 'BARTER',
};

type Props = {
  value: BarterOpennessValue;
  onChange: (value: BarterOpennessValue) => void;
};

export default function BarterOpennessSelector({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-semibold text-gray-900 mb-2">
        {t(valueExchangeSectionTitleKey())}
      </legend>
      <p className="text-xs text-gray-500 mb-2">
        {t('marketplace.barterOpenness.hint')}
      </p>
      <div className="grid gap-2 sm:grid-cols-1">
        {BARTER_OPENNESS_VALUES.map((option) => {
          const registry = PAYMENT_METHOD_REGISTRY[OPTION_REGISTRY[option]];
          const active = value === option;
          return (
            <label
              key={option}
              className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                active
                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="barterOpenness"
                className="mt-1 h-4 w-4 border-gray-300 text-emerald-600"
                checked={active}
                onChange={() => onChange(option)}
              />
              <span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <span aria-hidden>{registry.emoji}</span>
                  {t(registry.labelKey)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
