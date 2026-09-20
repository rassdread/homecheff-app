import { eurosToCents } from './core-constants';
import type { AowMonth2026 } from '../../../domain/aow';

function rate(numer: number, denom: number): { n: bigint; d: bigint } {
  return { n: BigInt(numer), d: BigInt(denom) };
}

/** IACK 2026 — same knikpunten below AOW and full-year AOW; rates differ. */
export const IACK_ZERO_THROUGH_CENTS = eurosToCents(6_239);
export const IACK_PHASE_IN_FROM_CENTS = eurosToCents(6_240);
export const IACK_MAX_FROM_CENTS = eurosToCents(32_711);
export const IACK_PHASE_IN_END_CENTS = eurosToCents(32_710);
export const IACK_BELOW_AOW_RATE = rate(11_450, 100_000);
export const IACK_BELOW_AOW_MAX_CENTS = eurosToCents(3_032);
export const IACK_FULL_YEAR_AOW_RATE = rate(572, 10_000);
export const IACK_FULL_YEAR_AOW_MAX_CENTS = eurosToCents(1_513);

/** Box 1 full-year AOW 2026. Schijf 2/3 ceilings stay €78.426 / 49,50%. */
export const BOX1_AOW_RATE = rate(1_785, 10_000);
export const BOX1_AOW_BORN_BEFORE_1946_B1_MAX_CENTS = eurosToCents(41_123);
export const BOX1_AOW_BORN_ON_OR_AFTER_1946_B1_MAX_CENTS = eurosToCents(38_883);

/**
 * REACHES_AOW_IN_2026 schijf-1 monthly percentages.
 * Normative source: Belastingdienst box 1 2026 page, month table
 * “Percentage 1e schijf (tot € 38.883)”. First-bracket ceiling kept at
 * the official €38.883 amount used for 2026 schijf 1 (t/m, matching the
 * published euro threshold).
 */
export const BOX1_TRANSITION_B1_MAX_CENTS = eurosToCents(38_883);
export const BOX1_TRANSITION_SCHIJF1_RATE_BY_MONTH: Record<
  AowMonth2026,
  { n: bigint; d: bigint }
> = {
  JANUARY: rate(1_785, 10_000),
  FEBRUARY: rate(1_934, 10_000),
  MARCH: rate(2_083, 10_000),
  APRIL: rate(2_233, 10_000),
  MAY: rate(2_382, 10_000),
  JUNE: rate(2_531, 10_000),
  JULY: rate(2_680, 10_000),
  AUGUST: rate(2_829, 10_000),
  SEPTEMBER: rate(2_978, 10_000),
  OCTOBER: rate(3_128, 10_000),
  NOVEMBER: rate(3_277, 10_000),
  DECEMBER: rate(3_426, 10_000),
};

/** Algemene heffingskorting full-year AOW 2026. */
export const AHK_AOW_MAX_CENTS = eurosToCents(1_556);
export const AHK_AOW_FULL_MAX_INCOME_CENTS = eurosToCents(29_736);
export const AHK_AOW_PHASEOUT_RATE = rate(3_195, 100_000);
export const AHK_AOW_ZERO_FROM_CENTS = eurosToCents(78_427);

/** Arbeidskorting full-year AOW 2026 — same knikpunten, AOW percentages. */
export const AK_AOW_T1_RATE = rate(4_156, 100_000);
export const AK_AOW_T2_BASE_CENTS = eurosToCents(498);
export const AK_AOW_T2_RATE = rate(15_483, 100_000);
export const AK_AOW_T3_BASE_CENTS = eurosToCents(2_647);
export const AK_AOW_T3_RATE = rate(974, 100_000);
export const AK_AOW_T4_BASE_CENTS = eurosToCents(2_840);
export const AK_AOW_T4_PHASEOUT_RATE = rate(3_250, 100_000);

/** Ouderenkorting 2026 — AOW-leeftijd uiterlijk 31 december. */
export const OUDERENKORTING_MAX_CENTS = eurosToCents(2_067);
export const OUDERENKORTING_FULL_UNTIL_CENTS = eurosToCents(46_002);
export const OUDERENKORTING_PHASEOUT_RATE = rate(15, 100);
export const OUDERENKORTING_ZERO_FROM_CENTS = eurosToCents(59_783);
export const OUDERENKORTING_PHASEOUT_END_CENTS = eurosToCents(59_782);

/** Alleenstaandeouderenkorting 2026 — AOW-gerechtigden, not single-parent. */
export const ALLEENSTAANDE_OUDERENKORTING_CENTS = eurosToCents(540);

/**
 * Jonggehandicaptenkorting 2026 amount is published (€923) but eligibility
 * is not certified from existing VerdienCheck context. Module stays DRAFT.
 */
export const JONGGEHANDICAPTENKORTING_CENTS = eurosToCents(923);
