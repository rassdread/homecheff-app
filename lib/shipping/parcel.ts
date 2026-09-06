/**
 * Authoritative parcel validation for HomeCheff carrier shipping (EctaroShip).
 * Units: weight kg, dimensions cm. No zero/negative; reasonable maximums.
 */

export type ParcelDimensionsCm = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type ParcelInput = ParcelDimensionsCm & {
  weightKg: number;
};

export type ParcelValidationResult =
  | { ok: true; parcel: ParcelInput }
  | { ok: false; error: string; code: string };

/** Soft commercial limits for domestic parcels (NL). */
export const PARCEL_LIMITS = {
  weightKgMin: 0.01,
  weightKgMax: 30,
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

export function validateParcel(input: {
  weightKg?: unknown;
  lengthCm?: unknown;
  widthCm?: unknown;
  heightCm?: unknown;
}): ParcelValidationResult {
  const weightKg = toFiniteNumber(input.weightKg);
  const lengthCm = toFiniteNumber(input.lengthCm);
  const widthCm = toFiniteNumber(input.widthCm);
  const heightCm = toFiniteNumber(input.heightCm);

  if (weightKg == null || lengthCm == null || widthCm == null || heightCm == null) {
    return {
      ok: false,
      code: 'PARCEL_INCOMPLETE',
      error: 'Gewicht en afmetingen (l×b×h) zijn verplicht voor verzending.',
    };
  }

  if (weightKg < PARCEL_LIMITS.weightKgMin || weightKg > PARCEL_LIMITS.weightKgMax) {
    return {
      ok: false,
      code: 'PARCEL_WEIGHT_INVALID',
      error: `Gewicht moet tussen ${PARCEL_LIMITS.weightKgMin} en ${PARCEL_LIMITS.weightKgMax} kg liggen.`,
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
      weightKg: Math.round(weightKg * 1000) / 1000,
      lengthCm: Math.round(lengthCm * 10) / 10,
      widthCm: Math.round(widthCm * 10) / 10,
      heightCm: Math.round(heightCm * 10) / 10,
    },
  };
}

/** Aggregate parcels for a single-seller order (sum weight, max footprint, sum height). */
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

  let weightKg = 0;
  let lengthCm = 0;
  let widthCm = 0;
  let heightCm = 0;

  for (let i = 0; i < parcels.length; i++) {
    const q = Math.max(1, Math.floor(quantities[i] ?? 1));
    const p = parcels[i]!;
    weightKg += p.weightKg * q;
    lengthCm = Math.max(lengthCm, p.lengthCm);
    widthCm = Math.max(widthCm, p.widthCm);
    heightCm += p.heightCm * q;
  }

  return validateParcel({ weightKg, lengthCm, widthCm, heightCm });
}
