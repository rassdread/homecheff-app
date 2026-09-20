/**
 * Official NL-2026 kindgebonden budget parameters.
 * Wet op het kindgebonden budget geldend 1 januari 2026 + Dienst Toeslagen 2026.
 */

import { NL_2026_EFFECTIVE, SRC_KGB_DIENST_2026, SRC_KGB_WET_2026 } from './sources';

function meta(source: { officialSource: string; officialSourceUrl: string }) {
  return {
    officialSource: source.officialSource,
    officialSourceUrl: source.officialSourceUrl,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
    effectiveFrom: NL_2026_EFFECTIVE.effectiveFrom,
    effectiveUntil: NL_2026_EFFECTIVE.effectiveUntil,
    jurisdiction: 'NL' as const,
    year: 2026,
  };
}

export const KGB_PER_CHILD_CENTS = 258_000;
export const KGB_AGE_12_TO_15_CENTS = 72_400;
export const KGB_AGE_16_TO_17_CENTS = 96_400;
export const KGB_SINGLE_PARENT_CENTS = 341_600;
export const KGB_PHASEOUT = { n: BigInt(760), d: BigInt(10_000) };
export const KGB_THRESHOLD_SINGLE_CENTS = 2_973_600;
export const KGB_PARTNER_ADD_CENTS = 940_500;
export const KGB_THRESHOLD_PARTNER_CENTS =
  KGB_THRESHOLD_SINGLE_CENTS + KGB_PARTNER_ADD_CENTS;
export const KGB_ASSETS_SINGLE_CENTS = 14_601_100;
export const KGB_ASSETS_PARTNER_CENTS = 18_463_300;

export const KGB_ROUNDING = {
  policy: 'ROUND_HALF_UP_TO_WHOLE_EUROS_ANNUAL',
  status: 'ROUNDING_FROM_WET_WHOLE_EURO_AMOUNTS',
} as const;

export const CHILD_BUDGET_PARAMETER_META = {
  'kgb.perChildCents': { value: KGB_PER_CHILD_CENTS, ...meta(SRC_KGB_WET_2026) },
  'kgb.age12to15Cents': { value: KGB_AGE_12_TO_15_CENTS, ...meta(SRC_KGB_WET_2026) },
  'kgb.age16to17Cents': { value: KGB_AGE_16_TO_17_CENTS, ...meta(SRC_KGB_WET_2026) },
  'kgb.singleParentCents': { value: KGB_SINGLE_PARENT_CENTS, ...meta(SRC_KGB_WET_2026) },
  'kgb.phaseout': { value: KGB_PHASEOUT, ...meta(SRC_KGB_WET_2026) },
  'kgb.thresholdSingleCents': {
    value: KGB_THRESHOLD_SINGLE_CENTS,
    ...meta(SRC_KGB_DIENST_2026),
  },
  'kgb.thresholdPartnerCents': {
    value: KGB_THRESHOLD_PARTNER_CENTS,
    ...meta(SRC_KGB_WET_2026),
  },
  'kgb.assetsSingleCents': { value: KGB_ASSETS_SINGLE_CENTS, ...meta(SRC_KGB_WET_2026) },
  'kgb.assetsPartnerCents': { value: KGB_ASSETS_PARTNER_CENTS, ...meta(SRC_KGB_WET_2026) },
  'kgb.rounding': { value: KGB_ROUNDING, ...meta(SRC_KGB_WET_2026) },
} as const;
