/**
 * Official NL-2026 huurtoeslag parameters.
 * Sources: Wht 2026-01-01, Stcrt. 2025/39783, Bht 2026-01-01,
 * Wet verlaging eigen bijdrage huurtoeslag 2026-01-01, Dienst Toeslagen 2026.
 */

import {
  NL_2026_EFFECTIVE,
  SRC_HUURTOESLAG_BESLUIT_2026,
  SRC_HUURTOESLAG_DIENST_2026,
  SRC_HUURTOESLAG_EIGEN_BIJDRAGE_2026,
  SRC_HUURTOESLAG_GRENZEN_2026,
  SRC_HUURTOESLAG_KIND_VRIJSTELLING_2026,
  SRC_HUURTOESLAG_VERMOGEN_2026,
  SRC_HUURTOESLAG_WET_2026,
} from './sources';

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

/** Integer cents only — two-decimal euro amounts as cents, no float multiply. */
export const HT_NORMHUUR_MIN_IJKPUNT_CENTS = 25_249;
export const HT_NORMHUUR_REDUCTION_SINGLE_CENTS = 182;
export const HT_NORMHUUR_REDUCTION_MULTI_CENTS = 363;
export const HT_ART16_ADDITION_CENTS = 0;
export const HT_EIGEN_BIJDRAGE_REDUCTION_CENTS = 4_815;
export const HT_BASISHUUR_SINGLE_CENTS =
  HT_NORMHUUR_MIN_IJKPUNT_CENTS -
  HT_NORMHUUR_REDUCTION_SINGLE_CENTS +
  HT_ART16_ADDITION_CENTS -
  HT_EIGEN_BIJDRAGE_REDUCTION_CENTS;
export const HT_BASISHUUR_MULTI_CENTS =
  HT_NORMHUUR_MIN_IJKPUNT_CENTS -
  HT_NORMHUUR_REDUCTION_MULTI_CENTS +
  HT_ART16_ADDITION_CENTS -
  HT_EIGEN_BIJDRAGE_REDUCTION_CENTS;

export const HT_CALC_CAP_NORMAL_CENTS = 93_293;
export const HT_CALC_CAP_YOUTH_CENTS = 49_820;
export const HT_YOUTH_AGE_BELOW = 21;
export const HT_MINIMUM_AGE = 18;
export const HT_QUALITY_THRESHOLD_CENTS = 49_820;
export const HT_AFTOP_1_OR_2_CENTS = 71_302;
export const HT_AFTOP_3_PLUS_CENTS = 76_414;
export const HT_SLICE2_PCT = { n: BigInt(65), d: BigInt(100) };
export const HT_SLICE3_PCT = { n: BigInt(40), d: BigInt(100) };
export const HT_PHASEOUT_SINGLE = { n: BigInt(27), d: BigInt(100) };
export const HT_PHASEOUT_MULTI = { n: BigInt(22), d: BigInt(100) };
export const HT_MIN_IJKPUNT_SINGLE_CENTS = 2_342_500;
export const HT_MIN_IJKPUNT_MULTI_CENTS = 3_150_000;
export const HT_CHILD_INCOME_EXEMPTION_CENTS = 621_800;
export const HT_CHILD_EXEMPTION_AGE_BELOW = 23;
export const HT_ASSETS_SINGLE_CENTS = 3_847_900;
export const HT_ASSETS_PARTNER_JOINT_CENTS = 7_695_800;
export const HT_ASSETS_MEDEBEWONER_CENTS = 3_847_900;

export const HT_ROUNDING = {
  policy: 'ROUND_HALF_UP_MONTHLY_CENTS_THEN_TIMES_12',
  status: 'ROUNDING_PENDING_OFFICIAL_PDF_ORDER',
} as const;

export const HOUSING_ALLOWANCE_PARAMETER_META = {
  'ht.normhuurMinIjkpuntCents': {
    value: HT_NORMHUUR_MIN_IJKPUNT_CENTS,
    ...meta(SRC_HUURTOESLAG_GRENZEN_2026),
  },
  'ht.normhuurReductionSingleCents': {
    value: HT_NORMHUUR_REDUCTION_SINGLE_CENTS,
    ...meta(SRC_HUURTOESLAG_WET_2026),
  },
  'ht.normhuurReductionMultiCents': {
    value: HT_NORMHUUR_REDUCTION_MULTI_CENTS,
    ...meta(SRC_HUURTOESLAG_WET_2026),
  },
  'ht.art16AdditionCents': {
    value: HT_ART16_ADDITION_CENTS,
    ...meta(SRC_HUURTOESLAG_WET_2026),
  },
  'ht.eigenBijdrageReductionCents': {
    value: HT_EIGEN_BIJDRAGE_REDUCTION_CENTS,
    ...meta(SRC_HUURTOESLAG_EIGEN_BIJDRAGE_2026),
  },
  'ht.basishuurSingleCents': {
    value: HT_BASISHUUR_SINGLE_CENTS,
    ...meta(SRC_HUURTOESLAG_WET_2026),
  },
  'ht.basishuurMultiCents': {
    value: HT_BASISHUUR_MULTI_CENTS,
    ...meta(SRC_HUURTOESLAG_WET_2026),
  },
  'ht.calcCapNormalCents': {
    value: HT_CALC_CAP_NORMAL_CENTS,
    ...meta(SRC_HUURTOESLAG_GRENZEN_2026),
  },
  'ht.calcCapYouthCents': {
    value: HT_CALC_CAP_YOUTH_CENTS,
    ...meta(SRC_HUURTOESLAG_GRENZEN_2026),
  },
  'ht.youthAgeBelow': {
    value: HT_YOUTH_AGE_BELOW,
    ...meta(SRC_HUURTOESLAG_DIENST_2026),
  },
  'ht.qualityThresholdCents': {
    value: HT_QUALITY_THRESHOLD_CENTS,
    ...meta(SRC_HUURTOESLAG_GRENZEN_2026),
  },
  'ht.aftop1or2Cents': {
    value: HT_AFTOP_1_OR_2_CENTS,
    ...meta(SRC_HUURTOESLAG_GRENZEN_2026),
  },
  'ht.aftop3plusCents': {
    value: HT_AFTOP_3_PLUS_CENTS,
    ...meta(SRC_HUURTOESLAG_GRENZEN_2026),
  },
  'ht.slice2Pct': { value: HT_SLICE2_PCT, ...meta(SRC_HUURTOESLAG_BESLUIT_2026) },
  'ht.slice3Pct': { value: HT_SLICE3_PCT, ...meta(SRC_HUURTOESLAG_BESLUIT_2026) },
  'ht.phaseoutSingle': { value: HT_PHASEOUT_SINGLE, ...meta(SRC_HUURTOESLAG_WET_2026) },
  'ht.phaseoutMulti': { value: HT_PHASEOUT_MULTI, ...meta(SRC_HUURTOESLAG_WET_2026) },
  'ht.minIjkpuntSingleCents': {
    value: HT_MIN_IJKPUNT_SINGLE_CENTS,
    ...meta(SRC_HUURTOESLAG_GRENZEN_2026),
  },
  'ht.minIjkpuntMultiCents': {
    value: HT_MIN_IJKPUNT_MULTI_CENTS,
    ...meta(SRC_HUURTOESLAG_GRENZEN_2026),
  },
  'ht.childIncomeExemptionCents': {
    value: HT_CHILD_INCOME_EXEMPTION_CENTS,
    ...meta(SRC_HUURTOESLAG_KIND_VRIJSTELLING_2026),
  },
  'ht.assetsSingleCents': {
    value: HT_ASSETS_SINGLE_CENTS,
    ...meta(SRC_HUURTOESLAG_VERMOGEN_2026),
  },
  'ht.assetsPartnerJointCents': {
    value: HT_ASSETS_PARTNER_JOINT_CENTS,
    ...meta(SRC_HUURTOESLAG_VERMOGEN_2026),
  },
  'ht.assetsMedebewonerCents': {
    value: HT_ASSETS_MEDEBEWONER_CENTS,
    ...meta(SRC_HUURTOESLAG_VERMOGEN_2026),
  },
  'ht.rounding': { value: HT_ROUNDING, ...meta(SRC_HUURTOESLAG_WET_2026) },
} as const;
