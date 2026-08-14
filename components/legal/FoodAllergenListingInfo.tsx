'use client';

/**
 * LEGAL-2 — listing detail allergen display (before purchase).
 */

import {
  allergenLabel,
  type EuFoodAllergenId,
} from '@/lib/legal/eu-food-allergens';

type Props = {
  applicable: boolean;
  status: 'UNKNOWN' | 'CONFIRMED';
  allergens: EuFoodAllergenId[];
  locale?: 'nl' | 'en';
};

export default function FoodAllergenListingInfo({
  applicable,
  status,
  allergens,
  locale = 'nl',
}: Props) {
  if (!applicable) return null;

  if (status === 'UNKNOWN') {
    return (
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
        data-testid="food-allergens-unknown"
      >
        <p className="font-medium">Allergenen</p>
        <p className="mt-0.5">Allergeneninformatie nog niet bevestigd.</p>
      </div>
    );
  }

  if (allergens.length === 0) {
    return (
      <div
        className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950"
        data-testid="food-allergens-none"
      >
        <p className="font-medium">Allergenen</p>
        <p className="mt-0.5">
          De aanbieder heeft bevestigd dat geen van de 14 vermelde allergenen
          van toepassing is.
        </p>
      </div>
    );
  }

  const list = allergens.map((id) => allergenLabel(id, locale)).join(', ');

  return (
    <div
      className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-950"
      data-testid="food-allergens-present"
    >
      <p className="font-medium">Allergenen</p>
      <p className="mt-0.5">Bevat: {list}</p>
    </div>
  );
}
