'use client';

import { MessageCircle, CreditCard } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ProductOrderMethodValue } from '@/lib/product/order-method';

type Props = {
  value: ProductOrderMethodValue;
  onChange: (value: ProductOrderMethodValue) => void;
  className?: string;
};

export default function ProductOrderMethodSelector({
  value,
  onChange,
  className = '',
}: Props) {
  const { t } = useTranslation();

  const options: Array<{
    id: ProductOrderMethodValue;
    icon: typeof CreditCard;
    titleKey: string;
    descKey: string;
  }> = [
    {
      id: 'HOMECHEFF_PAYMENT',
      icon: CreditCard,
      titleKey: 'productOrder.method.homecheff.title',
      descKey: 'productOrder.method.homecheff.description',
    },
    {
      id: 'CONTACT',
      icon: MessageCircle,
      titleKey: 'productOrder.method.contact.title',
      descKey: 'productOrder.method.contact.description',
    },
  ];

  return (
    <fieldset className={`space-y-2 ${className}`}>
      <legend className="block text-sm font-semibold text-gray-900 mb-2">
        {t('productOrder.method.heading')}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`text-left rounded-xl border-2 p-3 transition-all ${
                selected
                  ? 'border-emerald-500 bg-emerald-50/80 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-emerald-200'
              }`}
              aria-pressed={selected}
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    selected ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {t(option.titleKey)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                    {t(option.descKey)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
