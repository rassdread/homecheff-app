/**
 * HomeCheff package UX presets — NOT carrier products / NOT fixed price tiers.
 * Persist actual L×W×H + weightGrams; quote live via EctaroShip products API.
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
  example: string;
  /** Suggested default weight grams for UI only — seller must confirm */
  suggestedWeightGrams: number | null;
};

export const PACKAGE_PRESETS: ParcelPreset[] = [
  {
    id: 'BRIEVENBUS',
    name: 'Brievenbus',
    lengthCm: 26,
    widthCm: 36,
    heightCm: 3,
    example: 'Kaarten, kleine accessoires, platte producten',
    suggestedWeightGrams: 200,
  },
  {
    id: 'KLEIN',
    name: 'Klein',
    lengthCm: 30,
    widthCm: 20,
    heightCm: 10,
    example: 'Kleine creaties en accessoires',
    suggestedWeightGrams: 850,
  },
  {
    id: 'MIDDEL',
    name: 'Middel',
    lengthCm: 40,
    widthCm: 30,
    heightCm: 20,
    example: 'Kleding, cadeaus, middelgrote producten',
    suggestedWeightGrams: 1500,
  },
  {
    id: 'GROOT',
    name: 'Groot',
    lengthCm: 50,
    widthCm: 40,
    heightCm: 25,
    example: 'Grotere creaties',
    suggestedWeightGrams: 3000,
  },
  {
    id: 'CUSTOM',
    name: 'Eigen formaat',
    lengthCm: null,
    widthCm: null,
    heightCm: null,
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
