/**
 * HomeCheff package UX presets — NOT carrier products / NOT fixed price tiers.
 * Persist actual L×W×H + weightGrams; quote live via EctaroShip products API.
 *
 * Dimensions are chosen to fit common NL mailbox / parcel constraints so the
 * live quote filter (e.g. exclude brievenbus when heightCm > 3.5) stays coherent.
 */

export type ParcelPresetId =
  | 'BRIEVENBUS'
  | 'KLEIN'
  | 'MIDDEL'
  | 'GROOT'
  | 'CUSTOM';

export type ParcelPreset = {
  id: ParcelPresetId;
  name: string;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  /** Soft max for UX guidance — live carrier products may be stricter */
  maxWeightKg: number | null;
  example: string;
  /** Suggested default weight grams for UI only — seller must confirm */
  suggestedWeightGrams: number | null;
};

/**
 * Canonical visual package classes for sellers.
 * Carrier/service selection happens at checkout via EctaroShip products API.
 */
export const PACKAGE_PRESETS: ParcelPreset[] = [
  {
    id: 'BRIEVENBUS',
    name: 'Brievenbuspakket',
    // PostNL mailbox-safe (also within DPD mailbox height)
    lengthCm: 38,
    widthCm: 26.5,
    heightCm: 3.2,
    maxWeightKg: 2,
    example: 'Kaarten, platte accessoires, dunne items',
    suggestedWeightGrams: 250,
  },
  {
    id: 'KLEIN',
    name: 'Klein pakket',
    lengthCm: 30,
    widthCm: 20,
    heightCm: 10,
    maxWeightKg: 3,
    example: 'Kleine creaties, accessoires, doosje',
    suggestedWeightGrams: 850,
  },
  {
    id: 'MIDDEL',
    name: 'Standaard pakket',
    lengthCm: 40,
    widthCm: 30,
    heightCm: 20,
    maxWeightKg: 10,
    example: 'Kleding, cadeaus, middelgrote producten',
    suggestedWeightGrams: 1500,
  },
  {
    id: 'GROOT',
    name: 'Groot pakket',
    lengthCm: 50,
    widthCm: 40,
    heightCm: 30,
    maxWeightKg: 20,
    example: 'Grotere creaties en dozen',
    suggestedWeightGrams: 3000,
  },
  {
    id: 'CUSTOM',
    name: 'Eigen formaat',
    lengthCm: null,
    widthCm: null,
    heightCm: null,
    maxWeightKg: 31.5,
    example: 'Zelf maten invullen',
    suggestedWeightGrams: null,
  },
];

export function getParcelPreset(id: string | null | undefined): ParcelPreset | null {
  if (!id) return null;
  return PACKAGE_PRESETS.find((p) => p.id === id) ?? null;
}

export function resolvePresetDimensions(
  presetId: string | null | undefined,
  custom: { lengthCm?: number | null; widthCm?: number | null; heightCm?: number | null },
): { lengthCm: number; widthCm: number; heightCm: number } | null {
  const preset = getParcelPreset(presetId);
  if (preset && preset.id !== 'CUSTOM' && preset.lengthCm && preset.widthCm && preset.heightCm) {
    return {
      lengthCm: preset.lengthCm,
      widthCm: preset.widthCm,
      heightCm: preset.heightCm,
    };
  }
  const lengthCm = custom.lengthCm;
  const widthCm = custom.widthCm;
  const heightCm = custom.heightCm;
  if (
    typeof lengthCm === 'number' &&
    typeof widthCm === 'number' &&
    typeof heightCm === 'number' &&
    lengthCm > 0 &&
    widthCm > 0 &&
    heightCm > 0
  ) {
    return { lengthCm, widthCm, heightCm };
  }
  return null;
}

/** True when carrier EctaroShip shipping is selected (not local pickup/delivery-only). */
export function isCarrierShippingSelected(input: {
  fulfillmentShipping?: boolean | null;
  deliveryMode?: string | null;
}): boolean {
  if (input.fulfillmentShipping === true) return true;
  const raw = String(input.deliveryMode ?? '')
    .toUpperCase()
    .trim();
  if (!raw) return false;
  if (raw.includes('SHIPPING')) return true;
  // BOTH = pickup + local delivery historically — NOT carrier shipping
  return false;
}
