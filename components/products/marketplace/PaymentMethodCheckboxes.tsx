'use client';

import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  onChange: (next: {
    acceptHomeCheffPayment: boolean;
    acceptDirectContact: boolean;
  }) => void;
};

export default function PaymentMethodCheckboxes({
  acceptHomeCheffPayment,
  acceptDirectContact,
  onChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-semibold text-gray-900 mb-2">
        {t('marketplace.payment.heading')}
      </legend>
      <p className="text-xs text-gray-500 mb-2">
        {t('marketplace.payment.hint')}
      </p>
      <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600"
          checked={acceptHomeCheffPayment}
          onChange={(e) =>
            onChange({
              acceptHomeCheffPayment: e.target.checked,
              acceptDirectContact,
            })
          }
        />
        <span>
          <span className="block text-sm font-medium text-gray-900">
            {t('marketplace.payment.homecheffTitle')}
          </span>
          <span className="block text-xs text-gray-600 mt-0.5">
            {t('marketplace.payment.homecheffDescription')}
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600"
          checked={acceptDirectContact}
          onChange={(e) =>
            onChange({
              acceptHomeCheffPayment,
              acceptDirectContact: e.target.checked,
            })
          }
        />
        <span>
          <span className="block text-sm font-medium text-gray-900">
            {t('marketplace.payment.directContactTitle')}
          </span>
          <span className="block text-xs text-gray-600 mt-0.5">
            {t('marketplace.payment.directContactDescription')}
          </span>
        </span>
      </label>
    </fieldset>
  );
}
