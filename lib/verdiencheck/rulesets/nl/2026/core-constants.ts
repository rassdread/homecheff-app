/**
 * Certified NL-2026 numeric constants (below-AOW where applicable).
 * Whole-euro thresholds → integer cents. Rates as integer fractions.
 */

export const CENTS_PER_EURO = 100;

export function eurosToCents(euros: number): number {
  if (!Number.isInteger(euros)) {
    throw new Error(`eurosToCents expects whole euros, got ${euros}`);
  }
  return euros * CENTS_PER_EURO;
}

function rate(numer: number, denom: number): { n: bigint; d: bigint } {
  return { n: BigInt(numer), d: BigInt(denom) };
}

/** Box 1 schijf 1 t/m €38.883 @ 35,75% */
export const BOX1_B1_MAX_CENTS = eurosToCents(38_883);
export const BOX1_B1_RATE = rate(3575, 10_000);

/** Box 1 schijf 2 t/m €78.426 @ 37,56% */
export const BOX1_B2_MAX_CENTS = eurosToCents(78_426);
export const BOX1_B2_RATE = rate(3756, 10_000);

/** Box 1 schijf 3 boven €78.426 @ 49,50% */
export const BOX1_B3_RATE = rate(4950, 10_000);

/** Algemene heffingskorting */
export const AHK_MAX_CENTS = eurosToCents(3_115);
export const AHK_FULL_MAX_INCOME_CENTS = eurosToCents(29_736);
export const AHK_PHASEOUT_START_CENTS = eurosToCents(29_737);
export const AHK_ZERO_FROM_CENTS = eurosToCents(78_427);
export const AHK_PHASEOUT_END_CENTS = eurosToCents(78_426);
export const AHK_PHASEOUT_RATE = rate(6398, 100_000);

/** Arbeidskorting knikpunten */
export const AK_T1_MAX_CENTS = eurosToCents(11_965);
export const AK_T1_RATE = rate(8324, 100_000);
export const AK_T2_START_CENTS = eurosToCents(11_966);
export const AK_T2_END_CENTS = eurosToCents(25_845);
export const AK_T2_BASE_CENTS = eurosToCents(996);
export const AK_T2_RATE = rate(31009, 100_000);
export const AK_T2_BASE_INCOME_CENTS = eurosToCents(11_965);
export const AK_T3_START_CENTS = eurosToCents(25_846);
export const AK_T3_END_CENTS = eurosToCents(45_592);
export const AK_T3_BASE_CENTS = eurosToCents(5_300);
export const AK_T3_RATE = rate(1950, 100_000);
export const AK_T3_BASE_INCOME_CENTS = eurosToCents(25_845);
export const AK_T4_START_CENTS = eurosToCents(45_593);
export const AK_T4_END_CENTS = eurosToCents(132_920);
export const AK_T4_BASE_CENTS = eurosToCents(5_685);
export const AK_T4_PHASEOUT_RATE = rate(6510, 100_000);
export const AK_T4_BASE_INCOME_CENTS = eurosToCents(45_592);
export const AK_ZERO_FROM_CENTS = eurosToCents(132_921);

/** Zvw */
export const ZVW_RATE = rate(485, 10_000);
export const ZVW_MAX_CONTRIBUTION_INCOME_CENTS = eurosToCents(79_409);

/** Zorgtoeslag */
export const ZT_THRESHOLD_CENTS = eurosToCents(29_736);
export const ZT_STANDARD_PREMIUM_CENTS = eurosToCents(2_119);
export const ZT_PCT_THRESHOLD_SINGLE = rate(1912, 100_000);
export const ZT_PCT_THRESHOLD_PARTNER = rate(4289, 100_000);
export const ZT_PCT_ABOVE_THRESHOLD = rate(13730, 100_000);
export const ZT_MAX_INCOME_SINGLE_CENTS = eurosToCents(40_857);
export const ZT_MAX_INCOME_PARTNER_CENTS = eurosToCents(51_142);
export const ZT_ASSETS_MAX_SINGLE_CENTS = eurosToCents(146_011);
export const ZT_ASSETS_MAX_PARTNER_CENTS = eurosToCents(184_633);
