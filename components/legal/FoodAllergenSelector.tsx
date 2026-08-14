'use client';

/**
 * LEGAL-2 — compact EU-14 allergen selector for prepared food offers.
 */

import { useMemo } from 'react';
import {
  EU_FOOD_ALLERGEN_IDS,
  EU_FOOD_ALLERGEN_LABELS,
  type EuFoodAllergenId,
} from '@/lib/legal/eu-food-allergens';

type Props = {
  selected: EuFoodAllergenId[];
  confirmed: boolean;
  onChangeSelected: (next: EuFoodAllergenId[]) => void;
  onChangeConfirmed: (next: boolean) => void;
  locale?: 'nl' | 'en';
  disabled?: boolean;
};

export default function FoodAllergenSelector({
  selected,
  confirmed,
  onChangeSelected,
  onChangeConfirmed,
  locale = 'nl',
  disabled,
}: Props) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (id: EuFoodAllergenId) => {
    if (disabled) return;
    const next = selectedSet.has(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChangeSelected(next);
    // Changing selection invalidates prior confirmation until re-checked
    if (confirmed) onChangeConfirmed(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Allergenen</h3>
        <p className="mt-1 text-sm text-gray-600">
          Geef aan welke van de 14 wettelijke allergenen in dit product
          voorkomen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EU_FOOD_ALLERGEN_IDS.map((id) => {
          const on = selectedSet.has(id);
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                on
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300'
              } disabled:opacity-50`}
            >
              {EU_FOOD_ALLERGEN_LABELS[id][locale]}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        Een lege selectie betekent pas “geen van de 14” nadat je hieronder
        bevestigt. Laat dit niet leeg zonder te bevestigen.
      </p>

      <label className="flex items-start gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          className="mt-1"
          checked={confirmed}
          disabled={disabled}
          onChange={(e) => onChangeConfirmed(e.target.checked)}
        />
        <span>Ik heb de allergeneninformatie gecontroleerd.</span>
      </label>
    </div>
  );
}
