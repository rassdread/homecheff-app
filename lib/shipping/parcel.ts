/**
 * Parcel validation — weight in GRAMS (EctaroShip Partner API unit).
 */

import { resolvePresetDimensions } from '@/lib/shipping/package-presets';

export type ParcelInput = {
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type ParcelValidationResult =
  | { ok: true; parcel: ParcelInput }
  | { ok: false; error: string; code: string };

export const PARCEL_LIMITS = {
  weightGramsMin: 1,
  weightGramsMax: 30_000,
  dimCmMin: 1,
  dimCmMax: 200,
} as const;

function toFiniteNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Prefer weightGrams; fall back to weightKg × 1000 for legacy listings. */
export function resolveWeightGrams(input: {
  weightGrams?: unknown;
  weightKg?: unknown;
}): number | null {
  const grams = toFiniteNumber(input.weightGrams);
  if (grams != null) return Math.round(grams);
  const kg = toFiniteNumber(input.weightKg);
  if (kg != null) return Math.round(kg * 1000);
  return null;
}

export function validateParcel(input: {
  weightGrams?: unknown;
  weightKg?: unknown;
  lengthCm?: unknown;
  widthCm?: unknown;
  heightCm?: unknown;
  parcelPreset?: unknown;
}): ParcelValidationResult {
  const weightGrams = resolveWeightGrams(input);
  const fromPreset = resolvePresetDimensions(
    typeof input.parcelPreset === 'string' ? input.parcelPreset : null,
    {
      lengthCm: toFiniteNumber(input.lengthCm),
      widthCm: toFiniteNumber(input.widthCm),
      heightCm: toFiniteNumber(input.heightCm),
    },
  );

  const lengthCm = fromPreset?.lengthCm ?? toFiniteNumber(input.lengthCm);
  const widthCm = fromPreset?.widthCm ?? toFiniteNumber(input.widthCm);
  const heightCm = fromPreset?.heightCm ?? toFiniteNumber(input.heightCm);

  if (weightGrams == null || lengthCm == null || widthCm == null || heightCm == null) {
    return {
      ok: false,
      code: 'PARCEL_INCOMPLETE',
      error: 'Gewicht (gram) en afmetingen (l×b×h) zijn verplicht voor verzending.',
    };
  }

  if (
    weightGrams < PARCEL_LIMITS.weightGramsMin ||
    weightGrams > PARCEL_LIMITS.weightGramsMax
  ) {
    return {
      ok: false,
      code: 'PARCEL_WEIGHT_INVALID',
      error: `Gewicht moet tussen ${PARCEL_LIMITS.weightGramsMin} en ${PARCEL_LIMITS.weightGramsMax} gram liggen.`,
    };
  }

  for (const [label, value] of [
    ['lengte', lengthCm],
    ['breedte', widthCm],
    ['hoogte', heightCm],
  ] as const) {
    if (value < PARCEL_LIMITS.dimCmMin || value > PARCEL_LIMITS.dimCmMax) {
      return {
        ok: false,
        code: 'PARCEL_DIMENSION_INVALID',
        error: `${label} moet tussen ${PARCEL_LIMITS.dimCmMin} en ${PARCEL_LIMITS.dimCmMax} cm liggen.`,
      };
    }
  }

  return {
    ok: true,
    parcel: {
      weightGrams: Math.round(weightGrams),
      lengthCm: Math.round(lengthCm * 10) / 10,
      widthCm: Math.round(widthCm * 10) / 10,
      heightCm: Math.round(heightCm * 10) / 10,
    },
  };
}

export function aggregateParcels(
  parcels: ParcelInput[],
  quantities: number[],
): ParcelValidationResult {
  if (parcels.length === 0) {
    return {
      ok: false,
      code: 'PARCEL_INCOMPLETE',
      error: 'Geen pakketgegevens beschikbaar.',
    };
  }

  let weightGrams = 0;
  let lengthCm = 0;
  let widthCm = 0;
  let heightCm = 0;

  for (let i = 0; i < parcels.length; i++) {
    const q = Math.max(1, Math.floor(quantities[i] ?? 1));
    const p = parcels[i]!;
    weightGrams += p.weightGrams * q;
    lengthCm = Math.max(lengthCm, p.lengthCm);
    widthCm = Math.max(widthCm, p.widthCm);
    heightCm += p.heightCm * q;
  }

  return validateParcel({ weightGrams, lengthCm, widthCm, heightCm });
}

/** @deprecated use weightGrams */
export function kgFromGrams(grams: number): number {
  return Math.round((grams / 1000) * 1000) / 1000;
}
