/**
 * Official 2026 owner-occupied home (eigen woning) rules.
 * Payroll knows nothing about this module.
 *
 * Sources verified 2026-09-22 against Belastingdienst primary pages.
 * Not a full IB return: no Box 3, no loan-part reconstruction, no partner optimiser.
 */

import { BOX1_B2_MAX_CENTS } from './core-constants';
import {
  SRC_EWF_2026,
  SRC_HILLEN_2026,
  SRC_TARIEFSAANPASSING_EW_2026,
  SRC_WOZ_IB_2026,
} from './sources';

export const OWNER_OCCUPIED_HOME_2026_ID = 'NL-2026-OWNER-OCCUPIED-HOME-V1' as const;
export const WOZ_REFERENCE_YEAR = 2026;
export const WOZ_VALUE_DATE = '2025-01-01';

/** Hillen 2026: 71.867% of (EWF − deductible costs). */
export const HILLEN_2026_NUMERATOR = 71_867;
export const HILLEN_2026_DENOMINATOR = 100_000;

/** 11.94% extra tax on own-home costs in the top Box 1 bracket. */
export const TARIEFSAANPASSING_2026_NUMERATOR = 1_194;
export const TARIEFSAANPASSING_2026_DENOMINATOR = 10_000;
export const TARIEFSAANPASSING_THRESHOLD_CENTS = BOX1_B2_MAX_CENTS;
export const MAX_OWN_HOME_DEDUCTION_RATE_BPS = 3_756;

export const EWF_BANDS_2026 = [
  { moreThanCents: 0, notMoreThanCents: 1_250_000, rateNumer: 0, rateDenom: 10_000, id: 'NIL' },
  { moreThanCents: 1_250_000, notMoreThanCents: 2_500_000, rateNumer: 10, rateDenom: 10_000, id: '0_10' },
  { moreThanCents: 2_500_000, notMoreThanCents: 5_000_000, rateNumer: 20, rateDenom: 10_000, id: '0_20' },
  { moreThanCents: 5_000_000, notMoreThanCents: 7_500_000, rateNumer: 25, rateDenom: 10_000, id: '0_25' },
  { moreThanCents: 7_500_000, notMoreThanCents: 135_000_000, rateNumer: 35, rateDenom: 10_000, id: '0_35' },
] as const;

export const EWF_HIGH_THRESHOLD_CENTS = 135_000_000;
export const EWF_HIGH_BASE_CENTS = 472_500;
export const EWF_HIGH_RATE_NUMER = 235;
export const EWF_HIGH_RATE_DENOM = 10_000;

export const OWNER_OCCUPIED_HOME_2026_SOURCES = {
  ewf: SRC_EWF_2026,
  woz: SRC_WOZ_IB_2026,
  hillen: SRC_HILLEN_2026,
  tariefsaanpassing: SRC_TARIEFSAANPASSING_EW_2026,
} as const;

function roundToWholeEuroCents(cents: number): number {
  return Math.round(cents / 100) * 100;
}

export type EigenwoningforfaitResult = {
  wozCents: number;
  eigenwoningforfaitCents: number;
  ruleBand: string;
  rateNumer: number;
  rateDenom: number;
  provenance: 'EXACT_RULE';
  sourceId: typeof OWNER_OCCUPIED_HOME_2026_ID;
};

export function calculateEigenwoningforfait2026(wozCents: number): EigenwoningforfaitResult | null {
  if (!Number.isFinite(wozCents) || wozCents < 0) return null;
  const woz = Math.round(wozCents);
  if (woz <= EWF_BANDS_2026[0].notMoreThanCents) {
    return {
      wozCents: woz,
      eigenwoningforfaitCents: 0,
      ruleBand: EWF_BANDS_2026[0].id,
      rateNumer: 0,
      rateDenom: 10_000,
      provenance: 'EXACT_RULE',
      sourceId: OWNER_OCCUPIED_HOME_2026_ID,
    };
  }
  if (woz > EWF_HIGH_THRESHOLD_CENTS) {
    const excess = woz - EWF_HIGH_THRESHOLD_CENTS;
    const variable = Math.round((excess * EWF_HIGH_RATE_NUMER) / EWF_HIGH_RATE_DENOM);
    return {
      wozCents: woz,
      eigenwoningforfaitCents: EWF_HIGH_BASE_CENTS + variable,
      ruleBand: 'HIGH_VALUE',
      rateNumer: EWF_HIGH_RATE_NUMER,
      rateDenom: EWF_HIGH_RATE_DENOM,
      provenance: 'EXACT_RULE',
      sourceId: OWNER_OCCUPIED_HOME_2026_ID,
    };
  }
  const band = EWF_BANDS_2026.find((row) => woz > row.moreThanCents && woz <= row.notMoreThanCents);
  if (!band) return null;
  const ewf = Math.round((woz * band.rateNumer) / band.rateDenom);
  return {
    wozCents: woz,
    eigenwoningforfaitCents: ewf,
    ruleBand: band.id,
    rateNumer: band.rateNumer,
    rateDenom: band.rateDenom,
    provenance: 'EXACT_RULE',
    sourceId: OWNER_OCCUPIED_HOME_2026_ID,
  };
}

/**
 * Hillen aftrek in whole euros (Belastingdienst examples: 200 × 71,867% = €144).
 */
export function calculateHillenAftrek2026(ewfMinusCostsCents: number): number {
  if (ewfMinusCostsCents <= 0) return 0;
  const diffEuros = Math.round(ewfMinusCostsCents / 100);
  const hillenEuros = Math.round((diffEuros * HILLEN_2026_NUMERATOR) / HILLEN_2026_DENOMINATOR);
  return hillenEuros * 100;
}

export function netOwnHomeBox1AdjustmentCents(input: {
  eigenwoningforfaitCents: number;
  deductibleInterestCents: number;
}): { hillenAdjustmentCents: number; netOwnHomeBox1AdjustmentCents: number } {
  const ewf = input.eigenwoningforfaitCents;
  const costs = input.deductibleInterestCents;
  const preliminary = ewf - costs;
  if (preliminary <= 0) {
    return { hillenAdjustmentCents: 0, netOwnHomeBox1AdjustmentCents: preliminary };
  }
  const hillen = calculateHillenAftrek2026(preliminary);
  return {
    hillenAdjustmentCents: hillen,
    netOwnHomeBox1AdjustmentCents: preliminary - hillen,
  };
}

/**
 * Extra tax because own-home costs in the top bracket are only worth 37.56%.
 * Belastingdienst: toetsingsbedrag = box1 + rente − €78.426; grondslag = min(rente, toetsingsbedrag).
 * €3.500 × 11,94% → €417 (floor whole euros).
 */
export function calculateTariefsaanpassingEigenWoning2026(input: {
  box1TaxableCents: number;
  deductibleOwnHomeCostsCents: number;
}): { toetsingsbedragCents: number; grondslagCents: number; extraTaxCents: number } {
  const costs = Math.max(0, Math.round(input.deductibleOwnHomeCostsCents));
  const box1 = Math.round(input.box1TaxableCents);
  const toetsingsbedragCents = box1 + costs - TARIEFSAANPASSING_THRESHOLD_CENTS;
  if (costs <= 0 || toetsingsbedragCents <= 0) {
    return { toetsingsbedragCents, grondslagCents: 0, extraTaxCents: 0 };
  }
  const grondslagCents = Math.min(costs, toetsingsbedragCents);
  const extraTaxEuros = Math.floor((Math.round(grondslagCents / 100) * TARIEFSAANPASSING_2026_NUMERATOR) / TARIEFSAANPASSING_2026_DENOMINATOR);
  return {
    toetsingsbedragCents,
    grondslagCents,
    extraTaxCents: extraTaxEuros * 100,
  };
}

export type OwnerOccupiedHomeStatus =
  | 'NOT_APPLICABLE'
  | 'UNKNOWN'
  | 'PARTIAL'
  | 'COMPLETE';

export type OwnerOccupiedHomeResult = {
  status: OwnerOccupiedHomeStatus;
  wozCents: number | null;
  eigenwoningforfaitCents: number | null;
  ruleBand: string | null;
  rateNumer: number | null;
  rateDenom: number | null;
  deductibleInterestCents: number | null;
  interestKnown: boolean;
  hillenAdjustmentCents: number | null;
  netOwnHomeBox1AdjustmentCents: number | null;
  shareBps: number;
  shareAssumed: boolean;
  applyToBox1: boolean;
  applyToAssessment: boolean;
  provenance: 'EXACT_RULE' | 'ESTIMATE' | 'PARTIAL' | 'UNKNOWN' | 'NOT_APPLICABLE';
  assumptions: string[];
  sourceId: typeof OWNER_OCCUPIED_HOME_2026_ID;
};

export type OwnerOccupiedHomeInput = {
  tenure: 'RENT' | 'OWNER_OCCUPIED' | 'OTHER' | 'UNKNOWN' | null;
  wozCents: number | null;
  interestStatus: 'KNOWN' | 'NONE' | 'UNKNOWN' | null;
  deductibleInterestCents: number | null;
  shareBps: number;
  shareAssumed: boolean;
  knownBox1: boolean;
  knownAssessment: boolean;
};

export function calculateOwnerOccupiedHome2026(input: OwnerOccupiedHomeInput): OwnerOccupiedHomeResult {
  const empty = (status: OwnerOccupiedHomeStatus, provenance: OwnerOccupiedHomeResult['provenance'], assumptions: string[] = []): OwnerOccupiedHomeResult => ({
    status,
    wozCents: null,
    eigenwoningforfaitCents: null,
    ruleBand: null,
    rateNumer: null,
    rateDenom: null,
    deductibleInterestCents: null,
    interestKnown: false,
    hillenAdjustmentCents: null,
    netOwnHomeBox1AdjustmentCents: null,
    shareBps: input.shareBps,
    shareAssumed: input.shareAssumed,
    applyToBox1: false,
    applyToAssessment: false,
    provenance,
    assumptions,
    sourceId: OWNER_OCCUPIED_HOME_2026_ID,
  });

  if (input.tenure !== 'OWNER_OCCUPIED') {
    return empty('NOT_APPLICABLE', 'NOT_APPLICABLE');
  }

  const applyToBox1 = !input.knownBox1;
  const applyToAssessment = !input.knownAssessment;
  const assumptions: string[] = [];
  if (input.shareAssumed) {
    assumptions.push('OWNER_HOME_SHARE_ASSUMED_ENTERED_AMOUNTS');
  }

  if (input.wozCents == null) {
    return {
      ...empty('UNKNOWN', 'UNKNOWN', [...assumptions, 'WOZ_UNKNOWN']),
      applyToBox1,
      applyToAssessment: false,
    };
  }

  const allocatedWoz = Math.round((input.wozCents * input.shareBps) / 10_000);
  const ewf = calculateEigenwoningforfait2026(allocatedWoz);
  if (!ewf) {
    return empty('UNKNOWN', 'UNKNOWN', [...assumptions, 'WOZ_INVALID']);
  }

  const interestKnown =
    input.interestStatus === 'NONE' ||
    (input.interestStatus === 'KNOWN' && input.deductibleInterestCents != null);
  const rawInterest =
    input.interestStatus === 'NONE'
      ? 0
      : input.interestStatus === 'KNOWN'
        ? input.deductibleInterestCents
        : null;
  const allocatedInterest =
    rawInterest == null ? null : Math.round((rawInterest * input.shareBps) / 10_000);

  if (!interestKnown || allocatedInterest == null) {
    assumptions.push('MORTGAGE_INTEREST_UNKNOWN_NOT_ZERO');
    return {
      status: 'PARTIAL',
      wozCents: allocatedWoz,
      eigenwoningforfaitCents: ewf.eigenwoningforfaitCents,
      ruleBand: ewf.ruleBand,
      rateNumer: ewf.rateNumer,
      rateDenom: ewf.rateDenom,
      deductibleInterestCents: null,
      interestKnown: false,
      hillenAdjustmentCents: null,
      netOwnHomeBox1AdjustmentCents: applyToBox1 ? ewf.eigenwoningforfaitCents : null,
      shareBps: input.shareBps,
      shareAssumed: input.shareAssumed,
      applyToBox1,
      applyToAssessment: applyToBox1 && applyToAssessment,
      provenance: 'PARTIAL',
      assumptions,
      sourceId: OWNER_OCCUPIED_HOME_2026_ID,
    };
  }

  const net = netOwnHomeBox1AdjustmentCents({
    eigenwoningforfaitCents: ewf.eigenwoningforfaitCents,
    deductibleInterestCents: allocatedInterest,
  });
  const provenance: OwnerOccupiedHomeResult['provenance'] = input.shareAssumed ? 'ESTIMATE' : 'EXACT_RULE';
  return {
    status: 'COMPLETE',
    wozCents: allocatedWoz,
    eigenwoningforfaitCents: ewf.eigenwoningforfaitCents,
    ruleBand: ewf.ruleBand,
    rateNumer: ewf.rateNumer,
    rateDenom: ewf.rateDenom,
    deductibleInterestCents: allocatedInterest,
    interestKnown: true,
    hillenAdjustmentCents: net.hillenAdjustmentCents,
    netOwnHomeBox1AdjustmentCents: applyToBox1 ? net.netOwnHomeBox1AdjustmentCents : null,
    shareBps: input.shareBps,
    shareAssumed: input.shareAssumed,
    applyToBox1,
    applyToAssessment: applyToBox1 && applyToAssessment,
    provenance,
    assumptions,
    sourceId: OWNER_OCCUPIED_HOME_2026_ID,
  };
}

export function roundOwnerHomeDisplayCents(cents: number): number {
  return roundToWholeEuroCents(cents);
}
