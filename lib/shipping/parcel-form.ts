import {
  getParcelPreset,
  type ParcelPresetId,
} from '@/lib/shipping/package-presets';

export type ParcelFormState = {
  parcelPreset: ParcelPresetId | '';
  weightGrams: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  domesticShippingEnabled: boolean;
};

export type ParcelApiPayload = {
  weightGrams: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  parcelPreset: string;
  shippingDomestic: boolean;
  shippingInternational: false;
};

export function validateParcelFormUi(state: ParcelFormState): string | null {
  if (!state.domesticShippingEnabled) {
    return 'Schakel «Verzenden binnen Nederland» in of schakel EctaroShip-verzending uit.';
  }
  if (!state.parcelPreset) {
    return 'Kies hoe groot het pakket wordt — selecteer een formaat hieronder.';
  }
  const g = Number(String(state.weightGrams).replace(',', '.'));
  const l = Number(String(state.lengthCm).replace(',', '.'));
  const w = Number(String(state.widthCm).replace(',', '.'));
  const h = Number(String(state.heightCm).replace(',', '.'));
  if (!(g > 0 && l > 0 && w > 0 && h > 0)) {
    if (state.parcelPreset === 'CUSTOM') {
      return 'Vul lengte, breedte, hoogte en gewicht in gram in.';
    }
    return 'Kies een pakketformaat en vul het gewicht in gram in.';
  }
  const preset = getParcelPreset(state.parcelPreset);
  if (preset?.maxWeightKg != null && g > preset.maxWeightKg * 1000) {
    return `Gewicht overschrijdt het max. van ${preset.maxWeightKg} kg voor dit formaat. Kies een groter pakket of lager gewicht.`;
  }
  return null;
}

export function buildParcelApiPayload(state: ParcelFormState): ParcelApiPayload {
  const grams = Math.round(Number(String(state.weightGrams).replace(',', '.')));
  return {
    weightGrams: grams,
    weightKg: grams / 1000,
    lengthCm: Number(String(state.lengthCm).replace(',', '.')),
    widthCm: Number(String(state.widthCm).replace(',', '.')),
    heightCm: Number(String(state.heightCm).replace(',', '.')),
    parcelPreset: state.parcelPreset || 'CUSTOM',
    shippingDomestic: state.domesticShippingEnabled,
    shippingInternational: false,
  };
}

export function parcelStateFromProduct(product: {
  weightGrams?: number | null;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  parcelPreset?: string | null;
  fulfillmentOptions?: unknown;
}): Partial<ParcelFormState> {
  const out: Partial<ParcelFormState> = {};
  if (product.weightGrams != null) {
    out.weightGrams = String(product.weightGrams);
  } else if (product.weightKg != null) {
    out.weightGrams = String(Math.round(Number(product.weightKg) * 1000));
  }
  if (product.lengthCm != null) out.lengthCm = String(product.lengthCm);
  if (product.widthCm != null) out.widthCm = String(product.widthCm);
  if (product.heightCm != null) out.heightCm = String(product.heightCm);
  if (product.parcelPreset) {
    out.parcelPreset = product.parcelPreset as ParcelPresetId;
  }
  const fo = product.fulfillmentOptions as Record<string, unknown> | null;
  if (fo && fo.shippingDomestic === false) {
    out.domesticShippingEnabled = false;
  }
  return out;
}
