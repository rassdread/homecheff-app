/**
 * Bijtelling privégebruik auto van de zaak, 2026.
 *
 * Official treatment (Handboek Loonheffingen 2026, uitgave maart 2026):
 * - §23.3.1 a car made available for private use is loon in natura; the value
 *   is added to the wage. §11.2.4 books it in kolom 4, and kolom 14 (loon voor
 *   de loonbelasting/volksverzekeringen) is kolom 3 + 4 + 5 − 7. The addition
 *   therefore raises taxable wage but is never paid into a bank account.
 * - §23.3.2 the basis is the Dutch catalogue price on the date of first
 *   admission, including bpm and btw. For cars older than 16 years the basis is
 *   the waarde in het economische verkeer (§23.3.20).
 * - §23.3.3 general percentages: 22% (datum 1e toelating on/after 2017-01-01),
 *   25% (before 2017-01-01) and 35% (older than 16 years). The annual amount is
 *   computed first; each loontijdvak takes a time-proportional share. When the
 *   applicable percentage changes during the year, two calculations are made.
 * - §23.3.4 discounts for cars without CO2 emission, the € 30.000/€ 35.000/
 *   € 40.000 caps, the exemption from the cap for hydrogen and qualifying
 *   solar-cell cars, and the 60-month term that starts on the first day of the
 *   month following the month of first admission / first registration.
 * - §23.3.5 no discounts remain for cars with limited (non-zero) CO2 emission.
 * - §23.3.7 an own contribution for private use withheld from net pay is
 *   deducted from the value of the private use. The balance may not be negative
 *   on a calendar-year basis.
 * - §23.3.15 the value may be left out when the employee drives at most 500
 *   private kilometres per calendar year AND this is supported by a sluitende
 *   rittenregistratie, other evidence, or a 'Verklaring geen privégebruik auto'.
 * - §23.3.22 the value influences income-dependent schemes such as zorg- and
 *   huurtoeslag, and no pension may be accrued over it.
 *
 * Out of scope for V1 (never silently assumed): excessief privégebruik,
 * bestelauto regimes, autobranche handreiking, cars available for only part of
 * the calendar year, and changing cars during the year.
 */

import { SRC_COMPANY_CAR_2026, SRC_COMPANY_CAR_RATES_2026 } from './sources';

export const COMPANY_CAR_2026_ID = 'NL-2026-COMPANY-CAR-V1' as const;

export const COMPANY_CAR_2026_SOURCES = {
  bijtelling: SRC_COMPANY_CAR_2026,
  rates: SRC_COMPANY_CAR_RATES_2026,
} as const;

export const COMPANY_CAR_RULE_YEAR = 2026 as const;

export type CompanyCarStatus = 'NONE' | 'PROVIDED' | 'UNKNOWN' | 'NOT_SUPPLIED';

export type CompanyCarPrivateUse =
  | 'OVER_500'
  | 'AT_OR_BELOW_500_WITH_EVIDENCE'
  | 'UNKNOWN';

export type CompanyCarCategory =
  | 'COMBUSTION_OR_OTHER'
  | 'ZERO_EMISSION'
  | 'HYDROGEN'
  | 'QUALIFYING_SOLAR'
  | 'UNKNOWN';

export type CompanyCarOwnContributionStatus = 'NONE' | 'AMOUNT' | 'UNKNOWN' | 'NOT_SUPPLIED';

/** Month is 1-12. The 60-month term needs the month, not only the year. */
export type CompanyCarYearMonth = { year: number; month: number };

export type CompanyCarValuationKind = 'CATALOGUE_VALUE' | 'MARKET_VALUE';

export type CompanyCarResolution =
  | 'NO_CAR'
  | 'NO_ADDITION'
  | 'CALCULATED'
  | 'PARTIAL'
  | 'UNKNOWN'
  | 'NOT_SUPPLIED';

export type CompanyCarPartialReason =
  | 'PRIVATE_USE_UNKNOWN'
  | 'FIRST_ADMISSION_UNKNOWN'
  | 'FIRST_REGISTRATION_UNKNOWN'
  | 'VEHICLE_CATEGORY_UNKNOWN'
  | 'VALUATION_UNKNOWN'
  | 'YOUNGTIMER_TRANSITION_UNRESOLVED';

export type CompanyCarAssumption =
  | 'BIJTELLING_IS_LOON_IN_NATURA_KOLOM_4'
  | 'BIJTELLING_IS_NOT_CASH_SALARY'
  | 'NO_PENSION_ACCRUAL_ON_BIJTELLING'
  | 'CAR_AVAILABLE_WHOLE_CALENDAR_YEAR'
  | 'NO_ADDITION_REQUIRES_OFFICIAL_EVIDENCE'
  | 'OWN_CONTRIBUTION_REDUCES_VALUE_OF_PRIVATE_USE'
  | 'OWN_CONTRIBUTION_WITHHELD_FROM_NET_PAY'
  | 'OWN_CONTRIBUTION_ANNUAL_BALANCE_NOT_NEGATIVE'
  | 'OWN_CONTRIBUTION_UNKNOWN_NOT_COUNTED'
  | 'SIXTY_MONTH_TERM_FROM_MONTH_AFTER_ADMISSION'
  | 'YOUNGTIMER_MARKET_VALUE_BASIS'
  | 'YOUNGTIMER_TRANSITIONAL_RULE_2026'
  | 'EXCESSIVE_PRIVATE_USE_NOT_MODELLED';

/** A period of the 2026 calendar year with one set of official percentages. */
export type CompanyCarRateComponent = {
  fromMonth: number;
  toMonth: number;
  months: number;
  lowRateBps: number;
  highRateBps: number;
  /** Cap in cents up to which the low rate applies; null means no cap. */
  capCents: number | null;
  annualValueCents: number;
  monthlyValueCents: number;
};

export type CompanyCarInput = {
  status: CompanyCarStatus;
  privateUse?: CompanyCarPrivateUse | null;
  vehicleCategory?: CompanyCarCategory | null;
  firstAdmission?: CompanyCarYearMonth | null;
  /** Datum 1e tenaamstelling; only needed for a datum 1e toelating before 2017. */
  firstRegistrationNl?: CompanyCarYearMonth | null;
  catalogueValueCents?: number | null;
  marketValueCents?: number | null;
  /** Only relevant for a car first admitted in 2010 (§23.3.20 overgangsrecht). */
  availableSince2025?: boolean | null;
  ownContributionStatus?: CompanyCarOwnContributionStatus | null;
  ownContributionAnnualCents?: number | null;
};

export type CompanyCarResult = {
  status: CompanyCarStatus;
  resolution: CompanyCarResolution;
  partialReason: CompanyCarPartialReason | null;
  valuationBasisCents: number | null;
  valuationBasisKind: CompanyCarValuationKind | null;
  grossAdditionBeforeOwnContributionCents: number | null;
  ownContributionAppliedCents: number | null;
  ownContributionEnteredCents: number | null;
  taxableAdditionAnnualCents: number | null;
  taxableAdditionMonthlyCents: number | null;
  rateComponents: readonly CompanyCarRateComponent[];
  rulePeriod: typeof COMPANY_CAR_RULE_YEAR;
  provenance: 'DERIVED' | 'ESTIMATE' | 'UNKNOWN';
  /** True only for an explicit "no company car" or a proven ≤ 500 km answer. */
  explicitNone: boolean;
  /** True when a car exists but the addition could not be determined. */
  unknown: boolean;
  ownContributionUnknown: boolean;
  assumptions: readonly CompanyCarAssumption[];
  sourceIds: readonly string[];
};

const SOURCE_IDS = [SRC_COMPANY_CAR_2026.officialSourceUrl, SRC_COMPANY_CAR_RATES_2026.officialSourceUrl];

const CAP_30K = 3_000_000;
const CAP_35K = 3_500_000;
const CAP_40K = 4_000_000;

type RateBand = { lowRateBps: number; highRateBps: number; capCents: number | null };

/** Hydrogen and qualifying solar-cell cars get the low rate on the whole basis. */
function withoutCap(band: RateBand): RateBand {
  return { ...band, capCents: null };
}

function zeroEmissionBandByAdmissionYear(year: number): {
  during: RateBand;
  after?: RateBand;
  sixtyMonthTerm: boolean;
} | null {
  if (year >= 2026) {
    return { during: { lowRateBps: 1800, highRateBps: 2200, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2025) {
    return { during: { lowRateBps: 1700, highRateBps: 2200, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2024 || year === 2023) {
    return { during: { lowRateBps: 1600, highRateBps: 2200, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2022) {
    return { during: { lowRateBps: 1600, highRateBps: 2200, capCents: CAP_35K }, sixtyMonthTerm: false };
  }
  if (year === 2021) {
    return {
      during: { lowRateBps: 1200, highRateBps: 2200, capCents: CAP_40K },
      after: { lowRateBps: 1800, highRateBps: 2200, capCents: CAP_30K },
      sixtyMonthTerm: true,
    };
  }
  if (year >= 2017) {
    return { during: { lowRateBps: 1800, highRateBps: 2200, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  return null;
}

function zeroEmissionBandByRegistrationYear(year: number): {
  during: RateBand;
  after?: RateBand;
  sixtyMonthTerm: boolean;
} | null {
  if (year >= 2026) {
    return { during: { lowRateBps: 2100, highRateBps: 2500, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2025) {
    return { during: { lowRateBps: 2000, highRateBps: 2500, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2024 || year === 2023) {
    return { during: { lowRateBps: 1900, highRateBps: 2500, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2022) {
    return { during: { lowRateBps: 1900, highRateBps: 2500, capCents: CAP_35K }, sixtyMonthTerm: false };
  }
  if (year === 2021) {
    return {
      during: { lowRateBps: 1500, highRateBps: 2500, capCents: CAP_40K },
      after: { lowRateBps: 2100, highRateBps: 2500, capCents: CAP_30K },
      sixtyMonthTerm: true,
    };
  }
  if (year >= 2010) {
    return { during: { lowRateBps: 2100, highRateBps: 2500, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  return null;
}

/** §23.3.4: zero-emission cars older than 16 years keep a discount on the 35%. */
function youngtimerZeroEmissionBandByRegistrationYear(year: number): {
  during: RateBand;
  after?: RateBand;
  sixtyMonthTerm: boolean;
} {
  if (year >= 2026) {
    return { during: { lowRateBps: 3100, highRateBps: 3500, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2025) {
    return { during: { lowRateBps: 3000, highRateBps: 3500, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2024 || year === 2023) {
    return { during: { lowRateBps: 2900, highRateBps: 3500, capCents: CAP_30K }, sixtyMonthTerm: false };
  }
  if (year === 2022) {
    return { during: { lowRateBps: 2900, highRateBps: 3500, capCents: CAP_35K }, sixtyMonthTerm: false };
  }
  if (year === 2021) {
    return {
      during: { lowRateBps: 2500, highRateBps: 3500, capCents: CAP_40K },
      after: { lowRateBps: 3100, highRateBps: 3500, capCents: CAP_30K },
      sixtyMonthTerm: true,
    };
  }
  return { during: { lowRateBps: 3100, highRateBps: 3500, capCents: CAP_30K }, sixtyMonthTerm: false };
}

function isZeroEmission(category: CompanyCarCategory): boolean {
  return (
    category === 'ZERO_EMISSION' || category === 'HYDROGEN' || category === 'QUALIFYING_SOLAR'
  );
}

function isCapExempt(category: CompanyCarCategory): boolean {
  return category === 'HYDROGEN' || category === 'QUALIFYING_SOLAR';
}

function monthIndex(value: CompanyCarYearMonth): number {
  return value.year * 12 + (value.month - 1);
}

function validYearMonth(value: CompanyCarYearMonth | null | undefined): value is CompanyCarYearMonth {
  if (value == null) return false;
  if (!Number.isInteger(value.year) || value.year < 1900 || value.year > COMPANY_CAR_RULE_YEAR) {
    return false;
  }
  return Number.isInteger(value.month) && value.month >= 1 && value.month <= 12;
}

/**
 * §23.3.4: the 60-month term starts on the first day of the month following the
 * month of first admission / first registration. Returns the last month of 2026
 * that still falls inside the term, or 0 when the term already expired.
 */
function lastDiscountMonthIn2026(start: CompanyCarYearMonth): number {
  const termEndExclusive = monthIndex(start) + 1 + 60;
  const januaryIndex = COMPANY_CAR_RULE_YEAR * 12;
  const covered = termEndExclusive - januaryIndex;
  if (covered <= 0) return 0;
  return Math.min(12, covered);
}

function annualValueForBand(basisCents: number, band: RateBand): number {
  const capped = band.capCents == null ? basisCents : Math.min(basisCents, band.capCents);
  const above = band.capCents == null ? 0 : Math.max(0, basisCents - band.capCents);
  return (
    Math.round((capped * band.lowRateBps) / 10_000) +
    Math.round((above * band.highRateBps) / 10_000)
  );
}

function rateComponent(
  basisCents: number,
  band: RateBand,
  fromMonth: number,
  toMonth: number,
): CompanyCarRateComponent {
  const annual = annualValueForBand(basisCents, band);
  return {
    fromMonth,
    toMonth,
    months: toMonth - fromMonth + 1,
    lowRateBps: band.lowRateBps,
    highRateBps: band.highRateBps,
    capCents: band.capCents,
    annualValueCents: annual,
    monthlyValueCents: Math.round(annual / 12),
  };
}

function flatBand(rateBps: number): RateBand {
  return { lowRateBps: rateBps, highRateBps: rateBps, capCents: null };
}

function emptyResult(
  status: CompanyCarStatus,
  resolution: CompanyCarResolution,
  partialReason: CompanyCarPartialReason | null,
  assumptions: CompanyCarAssumption[],
): CompanyCarResult {
  const explicitNone = resolution === 'NO_CAR' || resolution === 'NO_ADDITION';
  return {
    status,
    resolution,
    partialReason,
    valuationBasisCents: null,
    valuationBasisKind: null,
    grossAdditionBeforeOwnContributionCents: explicitNone ? 0 : null,
    ownContributionAppliedCents: explicitNone ? 0 : null,
    ownContributionEnteredCents: null,
    taxableAdditionAnnualCents: explicitNone ? 0 : null,
    taxableAdditionMonthlyCents: explicitNone ? 0 : null,
    rateComponents: [],
    rulePeriod: COMPANY_CAR_RULE_YEAR,
    provenance: explicitNone ? 'DERIVED' : 'UNKNOWN',
    explicitNone,
    unknown: !explicitNone && resolution !== 'NOT_SUPPLIED',
    ownContributionUnknown: false,
    assumptions,
    sourceIds: SOURCE_IDS,
  };
}

function ownContributionFor(input: CompanyCarInput): {
  cents: number;
  entered: number | null;
  unknown: boolean;
} {
  const status = input.ownContributionStatus ?? 'NOT_SUPPLIED';
  if (status === 'AMOUNT') {
    const cents = input.ownContributionAnnualCents;
    if (cents != null && Number.isInteger(cents) && cents >= 0) {
      return { cents, entered: cents, unknown: false };
    }
    return { cents: 0, entered: null, unknown: true };
  }
  if (status === 'NONE') return { cents: 0, entered: 0, unknown: false };
  return { cents: 0, entered: null, unknown: true };
}

/**
 * Annual bijtelling for 2026. Returns UNKNOWN/PARTIAL instead of a zero whenever
 * a car exists but the official rule cannot be applied with the known facts.
 */
export function calculateCompanyCarAddition2026(input: CompanyCarInput): CompanyCarResult {
  const base: CompanyCarAssumption[] = [
    'BIJTELLING_IS_LOON_IN_NATURA_KOLOM_4',
    'BIJTELLING_IS_NOT_CASH_SALARY',
    'NO_PENSION_ACCRUAL_ON_BIJTELLING',
  ];

  if (input.status === 'NONE') {
    return emptyResult('NONE', 'NO_CAR', null, base);
  }
  if (input.status !== 'PROVIDED') {
    return emptyResult(
      input.status,
      input.status === 'UNKNOWN' ? 'UNKNOWN' : 'NOT_SUPPLIED',
      null,
      base,
    );
  }

  const privateUse = input.privateUse ?? 'UNKNOWN';
  if (privateUse === 'AT_OR_BELOW_500_WITH_EVIDENCE') {
    return emptyResult('PROVIDED', 'NO_ADDITION', null, [
      ...base,
      'NO_ADDITION_REQUIRES_OFFICIAL_EVIDENCE',
    ]);
  }
  if (privateUse !== 'OVER_500') {
    return emptyResult('PROVIDED', 'PARTIAL', 'PRIVATE_USE_UNKNOWN', base);
  }

  const category = input.vehicleCategory ?? 'UNKNOWN';
  if (category === 'UNKNOWN') {
    return emptyResult('PROVIDED', 'PARTIAL', 'VEHICLE_CATEGORY_UNKNOWN', base);
  }
  const admission = input.firstAdmission;
  if (!validYearMonth(admission)) {
    return emptyResult('PROVIDED', 'PARTIAL', 'FIRST_ADMISSION_UNKNOWN', base);
  }

  const assumptions: CompanyCarAssumption[] = [...base, 'CAR_AVAILABLE_WHOLE_CALENDAR_YEAR'];
  const zeroEmission = isZeroEmission(category);
  const capExempt = isCapExempt(category);

  // §23.3.20: older than 16 years in 2026 means first admitted before 2010.
  // A car first admitted during 2010 turns 16 in 2026; the transitional rule
  // only covers cars already made available in 2025.
  const olderThan16 = admission.year < 2010;
  const turnsSixteenIn2026 = admission.year === 2010;
  let youngtimer = olderThan16;
  if (turnsSixteenIn2026) {
    if (input.availableSince2025 === true) {
      youngtimer = true;
      assumptions.push('YOUNGTIMER_TRANSITIONAL_RULE_2026');
    } else {
      return emptyResult(
        'PROVIDED',
        'PARTIAL',
        'YOUNGTIMER_TRANSITION_UNRESOLVED',
        assumptions,
      );
    }
  }

  const valuationKind: CompanyCarValuationKind = youngtimer ? 'MARKET_VALUE' : 'CATALOGUE_VALUE';
  const basisCents = youngtimer ? input.marketValueCents : input.catalogueValueCents;
  if (basisCents == null || !Number.isInteger(basisCents) || basisCents <= 0) {
    return emptyResult('PROVIDED', 'PARTIAL', 'VALUATION_UNKNOWN', assumptions);
  }
  if (youngtimer) assumptions.push('YOUNGTIMER_MARKET_VALUE_BASIS');

  // The datum 1e tenaamstelling drives the percentage for cars first admitted
  // before 2017 (§23.3.3) and for zero-emission youngtimers (§23.3.4).
  const usesRegistrationDate = youngtimer || admission.year < 2017;
  const registration = input.firstRegistrationNl;
  let table: { during: RateBand; after?: RateBand; sixtyMonthTerm: boolean } | null;
  let termStart: CompanyCarYearMonth = admission;

  if (youngtimer) {
    if (!zeroEmission) {
      table = { during: flatBand(3500), sixtyMonthTerm: false };
    } else {
      if (!validYearMonth(registration)) {
        return emptyResult('PROVIDED', 'PARTIAL', 'FIRST_REGISTRATION_UNKNOWN', assumptions);
      }
      table = youngtimerZeroEmissionBandByRegistrationYear(registration.year);
      termStart = registration;
    }
  } else if (!zeroEmission) {
    table = { during: flatBand(admission.year >= 2017 ? 2200 : 2500), sixtyMonthTerm: false };
  } else if (admission.year >= 2017) {
    table = zeroEmissionBandByAdmissionYear(admission.year);
  } else {
    if (!validYearMonth(registration)) {
      return emptyResult('PROVIDED', 'PARTIAL', 'FIRST_REGISTRATION_UNKNOWN', assumptions);
    }
    table = zeroEmissionBandByRegistrationYear(registration.year);
    termStart = registration;
  }
  if (table == null) {
    return emptyResult('PROVIDED', 'PARTIAL', 'FIRST_ADMISSION_UNKNOWN', assumptions);
  }
  if (usesRegistrationDate && zeroEmission && validYearMonth(registration)) {
    termStart = registration;
  }

  const duringBand = capExempt ? withoutCap(table.during) : table.during;
  const afterBand = table.after == null ? null : capExempt ? withoutCap(table.after) : table.after;

  const components: CompanyCarRateComponent[] = [];
  if (table.sixtyMonthTerm && afterBand != null) {
    assumptions.push('SIXTY_MONTH_TERM_FROM_MONTH_AFTER_ADMISSION');
    const lastDiscountMonth = lastDiscountMonthIn2026(termStart);
    if (lastDiscountMonth >= 12) {
      components.push(rateComponent(basisCents, duringBand, 1, 12));
    } else if (lastDiscountMonth <= 0) {
      components.push(rateComponent(basisCents, afterBand, 1, 12));
    } else {
      components.push(rateComponent(basisCents, duringBand, 1, lastDiscountMonth));
      components.push(rateComponent(basisCents, afterBand, lastDiscountMonth + 1, 12));
    }
  } else {
    components.push(rateComponent(basisCents, duringBand, 1, 12));
  }

  // §23.3.3: compute the calendar-year amount first. When the percentage
  // changes during the year the employer makes two calculations and adds the
  // time-proportional share of each per loontijdvak.
  const grossAnnual =
    components.length === 1
      ? components[0].annualValueCents
      : components.reduce((sum, part) => sum + part.monthlyValueCents * part.months, 0);

  const own = ownContributionFor(input);
  if (own.unknown) {
    assumptions.push('OWN_CONTRIBUTION_UNKNOWN_NOT_COUNTED');
  } else if (own.cents > 0) {
    assumptions.push('OWN_CONTRIBUTION_REDUCES_VALUE_OF_PRIVATE_USE');
    assumptions.push('OWN_CONTRIBUTION_WITHHELD_FROM_NET_PAY');
    assumptions.push('OWN_CONTRIBUTION_ANNUAL_BALANCE_NOT_NEGATIVE');
  }
  assumptions.push('EXCESSIVE_PRIVATE_USE_NOT_MODELLED');

  // §23.3.7: the calendar-year balance of value minus own contribution may not
  // be negative, and the excess gives no deduction anywhere else.
  const ownApplied = Math.min(own.cents, grossAnnual);
  const taxableAnnual = grossAnnual - ownApplied;

  return {
    status: 'PROVIDED',
    resolution: 'CALCULATED',
    partialReason: null,
    valuationBasisCents: basisCents,
    valuationBasisKind: valuationKind,
    grossAdditionBeforeOwnContributionCents: grossAnnual,
    ownContributionAppliedCents: ownApplied,
    ownContributionEnteredCents: own.entered,
    taxableAdditionAnnualCents: taxableAnnual,
    taxableAdditionMonthlyCents: Math.round(taxableAnnual / 12),
    rateComponents: components,
    rulePeriod: COMPANY_CAR_RULE_YEAR,
    provenance: own.unknown ? 'ESTIMATE' : 'DERIVED',
    explicitNone: false,
    unknown: false,
    ownContributionUnknown: own.unknown,
    assumptions,
    sourceIds: SOURCE_IDS,
  };
}

/**
 * The own contribution is withheld from net pay (§23.3.7), so it lowers the
 * bank deposit as well as the taxable addition. Returns the monthly cash
 * deduction only; the fiscal effect lives in the addition itself.
 */
export function companyCarOwnContributionMonthlyCents(result: CompanyCarResult): number {
  const applied = result.ownContributionAppliedCents;
  if (applied == null || applied <= 0) return 0;
  return Math.round(applied / 12);
}
