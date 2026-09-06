'use client';

import * as React from 'react';
import {
  PACKAGE_PRESETS,
  type ParcelPresetId,
} from '@/lib/shipping/package-presets';
import { PackageIllustration } from '@/components/shipping/PackageIllustration';

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

export function PackageSelector({
  presetId,
  onPresetChange,
  weightGrams,
  onWeightGramsChange,
  lengthCm,
  widthCm,
  heightCm,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  domesticEnabled,
  onDomesticChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Verzenden</h3>
        <p className="text-xs text-gray-600 mt-1">
          Verzendkosten worden automatisch berekend voor de koper op basis van
          bestemming, pakketformaat en gewicht.
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Je hoeft zelf geen verzendprijs in te stellen. Vul formaat en gewicht
          inclusief verpakking zo nauwkeurig mogelijk in.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          checked={domesticEnabled}
          onChange={(e) => onDomesticChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        Verzenden binnen Nederland
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-500">
        <input type="checkbox" disabled checked={false} className="w-4 h-4 rounded" />
        Internationaal verzenden — binnenkort beschikbaar
      </label>

      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Pakketformaat</p>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
          {PACKAGE_PRESETS.map((p) => {
            const selected = presetId === p.id;
            const dimLabel =
              p.lengthCm && p.widthCm && p.heightCm
                ? `${p.lengthCm} × ${p.widthCm} × ${p.heightCm} cm`
                : 'Zelf invullen';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPresetChange(p.id);
                  if (p.lengthCm && p.widthCm && p.heightCm) {
                    onLengthChange(String(p.lengthCm));
                    onWidthChange(String(p.widthCm));
                    onHeightChange(String(p.heightCm));
                  }
                }}
                className={`snap-start shrink-0 w-[148px] rounded-xl border-2 p-2 text-left transition ${
                  selected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <PackageIllustration presetId={p.id} className="w-full h-20" />
                <div className="mt-2 text-sm font-semibold text-gray-900">{p.name}</div>
                <div className="text-[11px] text-gray-600">{dimLabel}</div>
                <div className="text-[10px] text-gray-500 mt-1 leading-snug">{p.example}</div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          Voorbeelden garanderen geen acceptatie door elke vervoerder — de
          beschikbare methoden worden live berekend bij checkout.
        </p>
      </div>

      {presetId === 'CUSTOM' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Lengte (cm)</label>
            <input
              type="number"
              min={1}
              value={lengthCm}
              onChange={(e) => onLengthChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Breedte (cm)</label>
            <input
              type="number"
              min={1}
              value={widthCm}
              onChange={(e) => onWidthChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hoogte (cm)</label>
            <input
              type="number"
              min={1}
              value={heightCm}
              onChange={(e) => onHeightChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">
          Pakketgewicht
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={1}
            value={weightGrams}
            onChange={(e) => onWeightGramsChange(e.target.value)}
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="850"
          />
          <span className="text-sm text-gray-600">gram</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Weeg het product inclusief verpakking zo nauwkeurig mogelijk.
        </p>
      </div>
    </div>
  );
}
