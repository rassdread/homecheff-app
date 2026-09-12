'use client';

import * as React from 'react';
import {
  PACKAGE_PRESETS,
  getParcelPreset,
  type ParcelPresetId,
} from '@/lib/shipping/package-presets';
import { PackageIllustration } from '@/components/shipping/PackageIllustration';
import { useTranslation } from '@/hooks/useTranslation';
import { getShippingUiCopy } from '@/lib/shipping/i18n';
import type { EcosystemLanguage } from '@/lib/ecosystem-locale';

type Props = {
  presetId: ParcelPresetId | '';
  onPresetChange: (id: ParcelPresetId) => void;
  weightGrams: string;
  onWeightGramsChange: (v: string) => void;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  onLengthChange: (v: string) => void;
  onWidthChange: (v: string) => void;
  onHeightChange: (v: string) => void;
  domesticEnabled: boolean;
  onDomesticChange: (v: boolean) => void;
  /** Inline validation near the cards (never a raw API code) */
  error?: string | null;
};

export function PackageSelector(props: Props) {
  const { language } = useTranslation();
  const locale = (language === 'en' ? 'en' : 'nl') as EcosystemLanguage;
  const copy = getShippingUiCopy(locale);
  const cardsRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (props.error && cardsRef.current) {
      cardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [props.error]);

  const selectPreset = (id: ParcelPresetId) => {
    props.onPresetChange(id);
    const p = getParcelPreset(id);
    if (p?.lengthCm && p.widthCm && p.heightCm) {
      props.onLengthChange(String(p.lengthCm));
      props.onWidthChange(String(p.widthCm));
      props.onHeightChange(String(p.heightCm));
    }
    if (p?.suggestedWeightGrams != null && !props.weightGrams.trim()) {
      props.onWeightGramsChange(String(p.suggestedWeightGrams));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{copy.sizeQuestion}</h3>
        <p className="text-sm text-gray-600 mt-1">{copy.sizeHint}</p>
        <p className="text-xs text-gray-500 mt-2">{copy.autoCalc}</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          checked={props.domesticEnabled}
          onChange={(e) => props.onDomesticChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        {copy.domestic}
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-500">
        <input type="checkbox" disabled checked={false} className="w-4 h-4 rounded" />
        {copy.internationalSoon}
      </label>
      <p className="text-[11px] text-gray-500">{copy.internationalHelp}</p>

      <div ref={cardsRef}>
        <p className="text-sm font-medium text-gray-800 mb-2">{copy.packageFormat}</p>
        <div
          className={`grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 ${
            props.error ? 'ring-2 ring-red-400 rounded-xl p-1' : ''
          }`}
          role="radiogroup"
          aria-label={copy.packageFormat}
        >
          {PACKAGE_PRESETS.map((p) => {
            const selected = props.presetId === p.id;
            const dimLabel =
              p.lengthCm && p.widthCm && p.heightCm
                ? `${formatDim(p.lengthCm)} × ${formatDim(p.widthCm)} × ${formatDim(p.heightCm)} cm`
                : copy.presets.CUSTOM;
            const weightLabel =
              p.maxWeightKg != null
                ? locale === 'en'
                  ? `max. ${p.maxWeightKg} kg`
                  : `max. ${String(p.maxWeightKg).replace('.', ',')} kg`
                : null;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectPreset(p.id)}
                className={`relative w-full rounded-xl border-2 p-3 text-left transition touch-manipulation min-h-[7.5rem] ${
                  selected
                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
              >
                {selected ? (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    ✓ {copy.selected}
                  </span>
                ) : null}
                <PackageIllustration presetId={p.id} className="w-full h-16 sm:h-20" />
                <div className="mt-2 text-sm font-semibold text-gray-900 pr-16">
                  {copy.presets[p.id]}
                </div>
                <div className="text-xs text-gray-700 mt-0.5">{dimLabel}</div>
                {weightLabel ? (
                  <div className="text-xs font-medium text-gray-800 mt-0.5">{weightLabel}</div>
                ) : null}
                <div className="text-[11px] text-gray-500 mt-1 leading-snug">
                  {copy.examples[p.id]}
                </div>
                <div className="text-[11px] text-emerald-800 mt-1.5 font-medium">
                  {copy.priceAtCheckout}
                </div>
              </button>
            );
          })}
        </div>
        {props.error ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {props.error}
          </p>
        ) : null}
        <p className="text-[10px] text-gray-500 mt-2">{copy.presetDisclaimer}</p>
      </div>

      {props.presetId === 'CUSTOM' && (
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2">{copy.exactSize}</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{copy.length}</label>
              <input
                type="number"
                min={1}
                value={props.lengthCm}
                onChange={(e) => props.onLengthChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{copy.width}</label>
              <input
                type="number"
                min={1}
                value={props.widthCm}
                onChange={(e) => props.onWidthChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{copy.height}</label>
              <input
                type="number"
                min={1}
                value={props.heightCm}
                onChange={(e) => props.onHeightChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">
          {copy.weightLabel}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={1}
            value={props.weightGrams}
            onChange={(e) => props.onWeightGramsChange(e.target.value)}
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="850"
          />
          <span className="text-sm text-gray-600">{copy.gram}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{copy.weightHelp}</p>
      </div>
    </div>
  );
}

function formatDim(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}
