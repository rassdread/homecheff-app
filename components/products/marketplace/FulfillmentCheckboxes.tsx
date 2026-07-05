'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { FULFILLMENT_I18N_KEY } from '@/lib/marketplace/i18n-keys';
import type { FulfillmentOptionKey, FulfillmentOptions } from '@/lib/marketplace/listing-taxonomy';
import { FULFILLMENT_KEYS } from '@/lib/marketplace/listing-taxonomy';

type Props = {
  value: FulfillmentOptions;
  onChange: (next: FulfillmentOptions) => void;
};

export default function FulfillmentCheckboxes({ value, onChange }: Props) {
  const { t } = useTranslation();

  const toggle = (key: FulfillmentOptionKey) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-semibold text-gray-900 mb-2">
        {t('marketplace.fulfillment.heading')}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {FULFILLMENT_KEYS.map((key) => (
          <label
            key={key}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-emerald-600"
              checked={value[key]}
              onChange={() => toggle(key)}
            />
            <span className="text-sm text-gray-800">
              {t(FULFILLMENT_I18N_KEY[key])}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
