/**
 * Official NL-2026 kinderopvangtoeslag parameters.
 * Stb. 2025, 233 bijlage I + Besluit kinderopvangtoeslag 2026-01-01.
 * No linear interpolation — exact band lookup.
 */

import {
  NL_2026_EFFECTIVE,
  SRC_KOT_BESLUIT_2026,
  SRC_KOT_DIENST_2026,
  SRC_KOT_STB_2026,
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

export const KOT_MAX_RATE_DAYCARE_CENTS = 1_123;
export const KOT_MAX_RATE_BSO_CENTS = 998;
export const KOT_MAX_RATE_CHILDMINDER_CENTS = 849;
export const KOT_MAX_HOURS_PER_MONTH = 230;
export const KOT_MAX_HOURS_PER_YEAR = 2_760;
export const KOT_FIXED_FOOT_FIRST_CHILD = { n: BigInt(365), d: BigInt(1_000) };
export const KOT_FIXED_FOOT_FROM_CENTS = 16_565_800;

/**
 * Percentages in tenths of a percent (960 = 96.0%).
 * Bands inclusive. Last row: fromCents and higher.
 */
export const KOT_TABLE_2026: readonly {
  fromCents: number;
  toCents: number | null;
  firstTenths: number;
  nextTenths: number;
}[] = [
  { fromCents: 0, toCents: 2_414_900, firstTenths: 960, nextTenths: 960 },
  { fromCents: 2_415_000, toCents: 2_575_600, firstTenths: 960, nextTenths: 960 },
  { fromCents: 2_575_700, toCents: 2_736_300, firstTenths: 960, nextTenths: 960 },
  { fromCents: 2_736_400, toCents: 2_897_300, firstTenths: 960, nextTenths: 960 },
  { fromCents: 2_897_400, toCents: 3_057_900, firstTenths: 960, nextTenths: 960 },
  { fromCents: 3_058_000, toCents: 3_218_900, firstTenths: 960, nextTenths: 960 },
  { fromCents: 3_219_000, toCents: 3_379_500, firstTenths: 960, nextTenths: 960 },
  { fromCents: 3_379_600, toCents: 3_540_000, firstTenths: 960, nextTenths: 960 },
  { fromCents: 3_540_100, toCents: 3_712_900, firstTenths: 960, nextTenths: 960 },
  { fromCents: 3_713_000, toCents: 3_885_500, firstTenths: 960, nextTenths: 960 },
  { fromCents: 3_885_600, toCents: 4_058_600, firstTenths: 960, nextTenths: 960 },
  { fromCents: 4_058_700, toCents: 4_231_300, firstTenths: 960, nextTenths: 960 },
  { fromCents: 4_231_400, toCents: 4_404_600, firstTenths: 960, nextTenths: 960 },
  { fromCents: 4_404_700, toCents: 4_577_600, firstTenths: 960, nextTenths: 960 },
  { fromCents: 4_577_700, toCents: 4_754_600, firstTenths: 960, nextTenths: 960 },
  { fromCents: 4_754_700, toCents: 4_931_800, firstTenths: 960, nextTenths: 960 },
  { fromCents: 4_931_900, toCents: 5_109_200, firstTenths: 960, nextTenths: 960 },
  { fromCents: 5_109_300, toCents: 5_286_400, firstTenths: 960, nextTenths: 960 },
  { fromCents: 5_286_500, toCents: 5_464_100, firstTenths: 960, nextTenths: 960 },
  { fromCents: 5_464_200, toCents: 5_641_200, firstTenths: 960, nextTenths: 960 },
  { fromCents: 5_641_300, toCents: 5_818_400, firstTenths: 955, nextTenths: 956 },
  { fromCents: 5_818_500, toCents: 5_995_700, firstTenths: 948, nextTenths: 956 },
  { fromCents: 5_995_800, toCents: 6_189_500, firstTenths: 939, nextTenths: 956 },
  { fromCents: 6_189_600, toCents: 6_569_500, firstTenths: 924, nextTenths: 956 },
  { fromCents: 6_569_600, toCents: 6_949_200, firstTenths: 916, nextTenths: 952 },
  { fromCents: 6_949_300, toCents: 7_329_200, firstTenths: 905, nextTenths: 946 },
  { fromCents: 7_329_300, toCents: 7_709_400, firstTenths: 882, nextTenths: 942 },
  { fromCents: 7_709_500, toCents: 8_089_100, firstTenths: 859, nextTenths: 939 },
  { fromCents: 8_089_200, toCents: 8_469_300, firstTenths: 837, nextTenths: 932 },
  { fromCents: 8_469_400, toCents: 8_849_100, firstTenths: 812, nextTenths: 927 },
  { fromCents: 8_849_200, toCents: 9_229_100, firstTenths: 789, nextTenths: 922 },
  { fromCents: 9_229_200, toCents: 9_609_100, firstTenths: 767, nextTenths: 915 },
  { fromCents: 9_609_200, toCents: 9_988_900, firstTenths: 743, nextTenths: 909 },
  { fromCents: 9_989_000, toCents: 10_369_400, firstTenths: 721, nextTenths: 905 },
  { fromCents: 10_369_500, toCents: 10_749_200, firstTenths: 696, nextTenths: 902 },
  { fromCents: 10_749_300, toCents: 11_129_000, firstTenths: 673, nextTenths: 895 },
  { fromCents: 11_129_100, toCents: 11_509_000, firstTenths: 651, nextTenths: 891 },
  { fromCents: 11_509_100, toCents: 11_896_300, firstTenths: 627, nextTenths: 886 },
  { fromCents: 11_896_400, toCents: 12_285_700, firstTenths: 606, nextTenths: 879 },
  { fromCents: 12_285_800, toCents: 12_674_700, firstTenths: 585, nextTenths: 874 },
  { fromCents: 12_674_800, toCents: 13_063_800, firstTenths: 564, nextTenths: 870 },
  { fromCents: 13_063_900, toCents: 13_452_700, firstTenths: 542, nextTenths: 867 },
  { fromCents: 13_452_800, toCents: 13_842_000, firstTenths: 523, nextTenths: 860 },
  { fromCents: 13_842_100, toCents: 14_231_200, firstTenths: 504, nextTenths: 854 },
  { fromCents: 14_231_300, toCents: 14_620_500, firstTenths: 485, nextTenths: 850 },
  { fromCents: 14_620_600, toCents: 15_009_200, firstTenths: 465, nextTenths: 844 },
  { fromCents: 15_009_300, toCents: 15_398_200, firstTenths: 445, nextTenths: 840 },
  { fromCents: 15_398_300, toCents: 15_787_700, firstTenths: 425, nextTenths: 833 },
  { fromCents: 15_787_800, toCents: 16_176_600, firstTenths: 405, nextTenths: 827 },
  { fromCents: 16_176_700, toCents: 16_565_700, firstTenths: 385, nextTenths: 817 },
  { fromCents: 16_565_800, toCents: 16_954_700, firstTenths: 365, nextTenths: 814 },
  { fromCents: 16_954_800, toCents: 17_344_000, firstTenths: 365, nextTenths: 806 },
  { fromCents: 17_344_100, toCents: 17_733_500, firstTenths: 365, nextTenths: 797 },
  { fromCents: 17_733_600, toCents: 18_122_300, firstTenths: 365, nextTenths: 791 },
  { fromCents: 18_122_400, toCents: 18_511_400, firstTenths: 365, nextTenths: 782 },
  { fromCents: 18_511_500, toCents: 18_900_200, firstTenths: 365, nextTenths: 777 },
  { fromCents: 18_900_300, toCents: 19_289_600, firstTenths: 365, nextTenths: 769 },
  { fromCents: 19_289_700, toCents: 19_678_900, firstTenths: 365, nextTenths: 762 },
  { fromCents: 19_679_000, toCents: 20_068_100, firstTenths: 365, nextTenths: 755 },
  { fromCents: 20_068_200, toCents: 20_457_100, firstTenths: 365, nextTenths: 745 },
  { fromCents: 20_457_200, toCents: 20_845_800, firstTenths: 365, nextTenths: 740 },
  { fromCents: 20_845_900, toCents: 21_235_300, firstTenths: 365, nextTenths: 733 },
  { fromCents: 21_235_400, toCents: 21_624_200, firstTenths: 365, nextTenths: 725 },
  { fromCents: 21_624_300, toCents: 22_013_400, firstTenths: 365, nextTenths: 718 },
  { fromCents: 22_013_500, toCents: 22_402_600, firstTenths: 365, nextTenths: 712 },
  { fromCents: 22_402_700, toCents: 22_791_500, firstTenths: 365, nextTenths: 704 },
  { fromCents: 22_791_600, toCents: 23_180_700, firstTenths: 365, nextTenths: 696 },
  { fromCents: 23_180_800, toCents: 23_569_700, firstTenths: 365, nextTenths: 691 },
  { fromCents: 23_569_800, toCents: null, firstTenths: 365, nextTenths: 682 },
];

export const KOT_ROUNDING = {
  policy: 'ROUND_HALF_UP_ANNUAL_CENTS',
  status: 'ROUNDING_PENDING_OFFICIAL_PDF_ORDER',
} as const;

export const CHILDCARE_ALLOWANCE_PARAMETER_META = {
  'kot.maxRateDaycareCents': {
    value: KOT_MAX_RATE_DAYCARE_CENTS,
    ...meta(SRC_KOT_DIENST_2026),
  },
  'kot.maxRateBsoCents': { value: KOT_MAX_RATE_BSO_CENTS, ...meta(SRC_KOT_DIENST_2026) },
  'kot.maxRateChildminderCents': {
    value: KOT_MAX_RATE_CHILDMINDER_CENTS,
    ...meta(SRC_KOT_DIENST_2026),
  },
  'kot.maxHoursPerMonth': {
    value: KOT_MAX_HOURS_PER_MONTH,
    ...meta(SRC_KOT_BESLUIT_2026),
  },
  'kot.table': { value: 'KOT_TABLE_2026', ...meta(SRC_KOT_STB_2026) },
  'kot.firstChildRule': {
    value: 'MOST_HOURS_THEN_HIGHEST_COST_ELSE_UNKNOWN',
    ...meta(SRC_KOT_BESLUIT_2026),
  },
  'kot.rounding': { value: KOT_ROUNDING, ...meta(SRC_KOT_STB_2026) },
} as const;
