'use client';

import * as React from 'react';
import {
  PACKAGE_PRESETS,
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
};

export function PackageSelector(props: Props) {
  const { language } = useTranslation();
  const locale = (language === 'en' ? 'en' : 'nl') as EcosystemLanguage;
  const copy = getShippingUiCopy(locale);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{copy.title}</h3>
        <p className="text-xs text-gray-600 mt-1">{copy.autoCalc}</p>
        <p className="text-xs text-gray-600 mt-1">{copy.noPriceToSet}</p>
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

      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">{copy.packageFormat}</p>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
          {PACKAGE_PRESETS.map((p) => {
            const selected = props.presetId === p.id;
            const dimLabel =
              p.lengthCm && p.widthCm && p.heightCm
                ? `${p.lengthCm} × ${p.widthCm} × ${p.heightCm} cm`
                : copy.presets.CUSTOM;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  props.onPresetChange(p.id);
                  if (p.lengthCm && p.widthCm && p.heightCm) {
                    props.onLengthChange(String(p.lengthCm));
                    props.onWidthChange(String(p.widthCm));
                    props.onHeightChange(String(p.heightCm));
                  }
                }}
                className={`snap-start shrink-0 w-[148px] rounded-xl border-2 p-2 text-left transition ${
                  selected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <PackageIllustration presetId={p.id} className="w-full h-20" />
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {copy.presets[p.id]}
                </div>
                <div className="text-[11px] text-gray-600">{dimLabel}</div>
                <div className="text-[10px] text-gray-500 mt-1 leading-snug">
                  {copy.examples[p.id]}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-500 mt-1">{copy.presetDisclaimer}</p>
      </div>

      {props.presetId === 'CUSTOM' && (
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
