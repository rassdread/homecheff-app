'use client';

import { LocateFixed, MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

function HintWithEmphasis({ text, emphasis }: { text: string; emphasis: string }) {
  const phrase = emphasis.trim();
  const index = phrase ? text.indexOf(phrase) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <strong className="font-semibold text-gray-800">{phrase}</strong>
      {text.slice(index + phrase.length)}
    </>
  );
}

export function DeliveryOriginChoice({
  value,
  onChange,
}: {
  value: 'FIXED' | 'DYNAMIC';
  onChange: (mode: 'FIXED' | 'DYNAMIC') => void;
}) {
  const { t } = useTranslation();
  const tiles = [
    {
      mode: 'FIXED' as const,
      icon: <MapPin className="w-5 h-5" aria-hidden />,
      title: t('deliverySignup.fixedArea'),
      hint: t('deliverySignup.aroundHouse'),
    },
    {
      mode: 'DYNAMIC' as const,
      icon: <LocateFixed className="w-5 h-5" aria-hidden />,
      title: t('deliverySignup.flexible'),
      hint: (
        <HintWithEmphasis
          text={t('deliverySignup.multipleAreas')}
          emphasis={t('deliverySignup.currentLocationAction')}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('deliverySignup.deliveryMode')}
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tiles.map((tile) => (
          <button
            key={tile.mode}
            type="button"
            onClick={() => onChange(tile.mode)}
            className={`p-4 rounded-xl border-2 transition-all ${
              value === tile.mode
                ? 'border-primary-brand bg-primary-50 text-primary-brand'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              {tile.icon}
              <span className="text-sm font-medium">{tile.title}</span>
              <span className="text-xs text-gray-600">{tile.hint}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600">{t('deliverySignup.originExplain')}</p>
    </div>
  );
}
