/**
 * Presentation of certified calculator output.
 * Never recomputes tax/allowances. Never maps UNKNOWN to 0.
 */

import type { CalculatorResult, CalculatorReadyResult } from '../calculator/types';
import type { AllowanceSelection } from '../domain/allowances';
import { hasAllowance } from '../domain/allowances';
import { isUnknown, UNKNOWN, type CentsOrUnknown } from '../domain/unknown';
import { PERSONAL_ROUTE_COPY } from './copy';
import type {
  BaselinePresentationFacts,
  FinancialImpactPresentation,
  MoneySimulatorView,
  CurrentBaselineView,
  SimulatorAllowanceId,
  SimulatorAllowanceLine,
} from './types';

function knownNumber(value: CentsOrUnknown | null | undefined): number | null {
  if (value == null || isUnknown(value)) return null;
  return value;
}

function sumKnown(values: readonly CentsOrUnknown[]): CentsOrUnknown {
  let total = 0;
  let sawUnknown = false;
  let sawKnown = false;
  for (const value of values) {
    if (isUnknown(value)) {
      sawUnknown = true;
      continue;
    }
    sawKnown = true;
    total += value;
  }
  if (!sawKnown) return UNKNOWN;
  if (sawUnknown) return UNKNOWN;
  return total;
}

const ALLOWANCE_META: readonly {
  id: SimulatorAllowanceId;
  selected: (selection: AllowanceSelection | null) => boolean;
  missingKeys: readonly string[];
  excludedMissing: string;
}[] = [
  {
    id: 'HEALTHCARE',
    selected: (s) => (s ? hasAllowance(s, 'HEALTHCARE') : false),
    missingKeys: ['healthcareAssetsEligibility', 'partnerContext.hasPartner', 'partnerHealthcareInsuranceStatus', 'partnerAssessmentIncomeCents'],
    excludedMissing: 'Zorgtoeslag is niet meegenomen omdat gegevens over vermogen of toeslagpartner ontbreken.',
  },
  {
    id: 'RENT',
    selected: (s) => (s ? hasAllowance(s, 'RENT') : false),
    missingKeys: ['bareRentCentsPerMonth', 'housingHousehold', 'housingAssetsEligibility'],
    excludedMissing: 'Huurtoeslag is niet meegenomen omdat je huurgegevens ontbreken.',
  },
  {
    id: 'CHILD_BUDGET',
    selected: (s) => (s ? hasAllowance(s, 'CHILD_BUDGET') : false),
    missingKeys: ['childBudgetHousehold', 'childBudgetAssetsEligibility'],
    excludedMissing: 'Kindgebonden budget is niet meegenomen omdat gegevens over kinderen of huishouden ontbreken.',
  },
  {
    id: 'CHILDCARE',
    selected: (s) => (s ? hasAllowance(s, 'CHILDCARE') : false),
    missingKeys: ['childcareHousehold'],
    excludedMissing: 'Kinderopvangtoeslag is niet meegenomen omdat opvanggegevens ontbreken.',
  },
];

function snapshotField(
  snapshot: CalculatorReadyResult['baseline'],
  id: SimulatorAllowanceId,
): CentsOrUnknown {
  if (id === 'HEALTHCARE') return snapshot.healthcareAllowance;
  if (id === 'RENT') return snapshot.rentAllowance;
  if (id === 'CHILD_BUDGET') return snapshot.childBudget;
  return snapshot.childcareAllowance;
}

function deltaField(result: CalculatorReadyResult, id: SimulatorAllowanceId): CentsOrUnknown {
  if (id === 'HEALTHCARE') return result.deltas.healthcareAllowance;
  if (id === 'RENT') return result.deltas.rentAllowance;
  if (id === 'CHILD_BUDGET') return result.deltas.childBudget;
  return result.deltas.childcareAllowance;
}

function missingHits(missing: readonly string[], keys: readonly string[]): boolean {
  return keys.some(
    (key) => missing.includes(key) || missing.some((item) => item === key || item.startsWith(`${key}:`) || item.includes(key.split(':')[0] ?? key)),
  );
}

function emptyAllowanceLine(id: SimulatorAllowanceId): SimulatorAllowanceLine {
  return {
    id,
    included: false,
    currentCents: null,
    scenarioCents: null,
    deltaCents: null,
    rightLost: false,
    unchanged: false,
    unknown: false,
    notApplicable: false,
    excludedReason: null,
  };
}

function buildAllowanceLine(
  result: CalculatorReadyResult,
  meta: (typeof ALLOWANCE_META)[number],
  allowances: AllowanceSelection | null,
  missing: readonly string[],
): SimulatorAllowanceLine {
  const selected = meta.selected(allowances);
  const current = snapshotField(result.baseline, meta.id);
  const scenario = snapshotField(result.scenario, meta.id);
  const delta = deltaField(result, meta.id);
  const currentN = knownNumber(current);
  const scenarioN = knownNumber(scenario);
  const unknown = isUnknown(current) || isUnknown(scenario) || isUnknown(delta);
  const prefix =
    meta.id === 'RENT'
      ? 'housing:'
      : meta.id === 'CHILD_BUDGET'
        ? 'childBudget:'
        : meta.id === 'CHILDCARE'
          ? 'childcare:'
          : null;
  const missingForThis =
    missingHits(missing, [...meta.missingKeys, 'baselineAssessmentIncomeCents']) ||
    (prefix != null && missing.some((item) => item.startsWith(prefix)));

  if (!selected) {
    return emptyAllowanceLine(meta.id);
  }

  if (unknown || missingForThis) {
    return {
      id: meta.id,
      included: false,
      currentCents: unknown ? UNKNOWN : current,
      scenarioCents: unknown ? UNKNOWN : scenario,
      deltaCents: unknown ? UNKNOWN : delta,
      rightLost: false,
      unchanged: false,
      unknown: true,
      notApplicable: false,
      excludedReason: meta.excludedMissing,
    };
  }

  return {
    id: meta.id,
    included: true,
    currentCents: current,
    scenarioCents: scenario,
    deltaCents: delta,
    rightLost: currentN != null && currentN > 0 && scenarioN === 0,
    unchanged: currentN != null && scenarioN != null && currentN === scenarioN,
    unknown: false,
    notApplicable: false,
    excludedReason: null,
  };
}

function notApplicableLine(id: SimulatorAllowanceId): SimulatorAllowanceLine {
  return {
    ...emptyAllowanceLine(id),
    notApplicable: true,
  };
}

function unknownRelevantLine(
  id: SimulatorAllowanceId,
  reason: string,
): SimulatorAllowanceLine {
  return {
    ...emptyAllowanceLine(id),
    unknown: true,
    currentCents: UNKNOWN,
    scenarioCents: UNKNOWN,
    deltaCents: UNKNOWN,
    excludedReason: reason,
  };
}

function classifyUnselectedBaselineLine(
  meta: (typeof ALLOWANCE_META)[number],
  facts: BaselinePresentationFacts | undefined,
): SimulatorAllowanceLine | null {
  if (facts == null) return null;
  if (facts.allowancesNone) return notApplicableLine(meta.id);
  if (meta.id === 'RENT') {
    if (facts.housingTenure === 'DOES_NOT_RENT') return notApplicableLine(meta.id);
    if (facts.housingTenure === 'UNKNOWN' || facts.housingTenure == null) {
      return unknownRelevantLine(meta.id, meta.excludedMissing);
    }
  }
  if (meta.id === 'CHILD_BUDGET') {
    if (facts.hasChildren === false) return notApplicableLine(meta.id);
    if (facts.hasChildren === 'UNKNOWN' || facts.hasChildren == null) {
      return unknownRelevantLine(meta.id, meta.excludedMissing);
    }
  }
  if (meta.id === 'CHILDCARE') {
    if (facts.usesChildcare === false || facts.hasChildren === false) {
      return notApplicableLine(meta.id);
    }
    if (
      facts.usesChildcare === 'UNKNOWN' ||
      facts.usesChildcare == null ||
      facts.hasChildren === 'UNKNOWN' ||
      facts.hasChildren == null
    ) {
      return unknownRelevantLine(meta.id, meta.excludedMissing);
    }
  }
  if (meta.id === 'HEALTHCARE') {
    return notApplicableLine(meta.id);
  }
  return notApplicableLine(meta.id);
}

function uncertaintyFromMissing(missing: readonly string[], allowances: AllowanceSelection | null): string | null {
  if (missing.includes('baselineBox1TaxableIncomeCents') || missing.includes('baselineAggregateIncomeCents') || missing.includes('baselineArbeidsinkomenCents') || missing.includes('baselineAssessmentIncomeCents')) {
    return 'Je huidige inkomen is niet volledig bekend. Daardoor is deze uitkomst een indicatie. Ontbrekende bedragen zijn niet als €0 meegenomen.';
  }
  if (missing.includes('allowances') || allowances?.includes('UNKNOWN')) {
    return 'Toeslagen zijn nog niet te berekenen omdat je situatie daarvoor onvolledig is. Ontbrekende bedragen zijn niet als €0 meegenomen.';
  }
  if (missing.includes('bareRentCentsPerMonth') || missing.includes('housingHousehold') || missing.some((item) => item.startsWith('housing:'))) {
    return 'Huurtoeslag is niet meegenomen omdat je huurgegevens ontbreken.';
  }
  if (missing.includes('childcareHousehold') || missing.some((item) => item.startsWith('childcare:'))) {
    return 'Kinderopvangtoeslag is niet meegenomen omdat opvanggegevens ontbreken.';
  }
  if (missing.includes('childBudgetHousehold') || missing.some((item) => item.startsWith('childBudget:'))) {
    return 'Kindgebonden budget is niet meegenomen omdat gegevens over kinderen ontbreken.';
  }
  if (missing.length > 0) {
    return 'Niet alle benodigde gegevens zijn bekend. Ontbrekende onderdelen zijn niet als €0 meegenomen.';
  }
  return null;
}

function uniqueNotes(notes: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const note of notes) {
    if (!note || seen.has(note)) continue;
    seen.add(note);
    out.push(note);
  }
  return out;
}

function emptySimulator(extra: number | null, why: string | null): MoneySimulatorView {
  return {
    extraResultCents: extra,
    taxDeltaCents: UNKNOWN,
    incomeTaxDeltaCents: UNKNOWN,
    zvwDeltaCents: UNKNOWN,
    currentIncomeTaxCents: UNKNOWN,
    scenarioIncomeTaxCents: UNKNOWN,
    currentZvwCents: UNKNOWN,
    scenarioZvwCents: UNKNOWN,
    allowances: ALLOWANCE_META.map((meta) => emptyAllowanceLine(meta.id)),
    netExtraCents: UNKNOWN,
    monthlyApproxCents: UNKNOWN,
    netFromEngine: true,
    includedNotes: [],
    excludedNotes: uniqueNotes([why]),
    uncertaintyWhy: why,
    showZvwEmployerNote: false,
  };
}

export function buildMoneySimulatorView(
  result: CalculatorReadyResult,
  allowances: AllowanceSelection | null,
  facts?: BaselinePresentationFacts,
): MoneySimulatorView {
  const missing = result.missingInputs;
  const lines = ALLOWANCE_META.map((meta) => buildAllowanceLine(result, meta, allowances, missing));
  const included = lines.filter((line) => line.included);
  const excluded = lines.filter((line) => !line.included && line.excludedReason);
  const tax = sumKnown([result.deltas.incomeTax, result.deltas.zvw]);
  const extra = result.commercialAdditionalResultCents;
  const net = result.netExtraCents;
  const month = result.netExtraPerMonthCents;
  const why =
    isUnknown(net) || !result.netExtraIsDefinitive
      ? uncertaintyFromMissing(missing, allowances)
      : null;
  const includedNotes: string[] = [];
  if (knownNumber(tax) != null) includedNotes.push('Belasting is meegenomen.');
  if (included.some((line) => line.id === 'HEALTHCARE')) includedNotes.push('Zorgtoeslag is meegenomen.');
  if (included.some((line) => line.id === 'RENT')) includedNotes.push('Huurtoeslag is meegenomen.');
  if (included.some((line) => line.id === 'CHILD_BUDGET')) includedNotes.push('Kindgebonden budget is meegenomen.');
  if (included.some((line) => line.id === 'CHILDCARE')) includedNotes.push('Kinderopvangtoeslag is meegenomen.');
  if (result.netExtraIsDefinitive && !isUnknown(net)) {
    includedNotes.push('Berekening compleet.');
  }
  const currentZvw = knownNumber(result.baseline.zvwContribution);
  return {
    extraResultCents: extra,
    taxDeltaCents: tax,
    incomeTaxDeltaCents: result.deltas.incomeTax,
    zvwDeltaCents: result.deltas.zvw,
    currentIncomeTaxCents: result.baseline.incomeTax,
    scenarioIncomeTaxCents: result.scenario.incomeTax,
    currentZvwCents: result.baseline.zvwContribution,
    scenarioZvwCents: result.scenario.zvwContribution,
    allowances: lines,
    netExtraCents: isUnknown(net) || !result.netExtraIsDefinitive ? UNKNOWN : net,
    monthlyApproxCents: isUnknown(month) || !result.netExtraIsDefinitive ? UNKNOWN : month,
    netFromEngine: true,
    includedNotes,
    excludedNotes: uniqueNotes(excluded.map((line) => line.excludedReason)),
    uncertaintyWhy: why,
    showZvwEmployerNote: facts?.employeeLikeZvw === true && currentZvw === 0,
  };
}

function monthlyFromAnnual(cents: number): number {
  return Math.round(cents / 12);
}

export function buildCurrentBaselineView(
  result: CalculatorReadyResult,
  allowances: AllowanceSelection | null,
  facts?: BaselinePresentationFacts,
): CurrentBaselineView {
  const missing = result.missingInputs;
  const lines = ALLOWANCE_META.map((meta) => {
    const computed = buildAllowanceLine(result, meta, allowances, missing);
    if (computed.included || computed.unknown) return computed;
    const classified = classifyUnselectedBaselineLine(meta, facts);
    if (classified) return classified;
    return null;
  }).filter((line): line is SimulatorAllowanceLine => line != null);

  const relevantUnknown = lines.some((line) => line.unknown && !line.notApplicable);
  const includedKnown = lines
    .filter((line) => line.included && !line.unknown && !line.notApplicable)
    .map((line) => knownNumber(line.currentCents) ?? UNKNOWN);
  const totalAnnual = relevantUnknown ? UNKNOWN : sumKnown(includedKnown);
  const totalMonthly =
    typeof totalAnnual === 'number' ? monthlyFromAnnual(totalAnnual) : totalAnnual;
  const incomeAnnual =
    facts?.incomeAnnualCents ??
    facts?.fiscalWageCents ??
    facts?.assessmentIncomeCents ??
    null;
  const fiscal = facts?.fiscalWageCents ?? null;
  const assessment = facts?.assessmentIncomeCents ?? null;
  const currentZvw = knownNumber(result.baseline.zvwContribution);
  return {
    incomeAnnualCents: incomeAnnual,
    incomeMonthlyCents:
      facts?.incomeMonthlyCents ?? (incomeAnnual != null ? monthlyFromAnnual(incomeAnnual) : null),
    contractualGrossCents: facts?.contractualGrossCents ?? null,
    holidayPayCents: facts?.holidayPayCents ?? null,
    holidayPayIncluded: facts?.holidayPayIncluded ?? null,
    fiscalWageCents: fiscal,
    assessmentIncomeCents: assessment,
    enteredNetMonthlyCents: facts?.enteredNetMonthlyCents ?? null,
    enteredGrossMonthlyCents: facts?.enteredGrossMonthlyCents ?? null,
    estimatedGrossMonthlyCents: facts?.estimatedGrossMonthlyCents ?? null,
    statutoryNetMonthlyCents: facts?.statutoryNetMonthlyCents ?? null,
    payrollUsed: facts?.payrollUsed === true,
    payrollTaxCredit: facts?.payrollTaxCredit ?? null,
    payrollTaxCreditAssumed: facts?.payrollTaxCreditAssumed === true,
    incomeUnknown: facts?.incomeUnknown === true,
    incomeUnknownReason: facts?.incomeUnknownReason ?? null,
    incomeIsNetEstimate: facts?.incomeIsNetEstimate === true,
    showDistinctFiscal: fiscal != null && incomeAnnual != null && fiscal !== incomeAnnual,
    showDistinctAssessment:
      assessment != null &&
      assessment !== fiscal &&
      assessment !== incomeAnnual,
    incomeTaxAnnualCents: result.baseline.incomeTax,
    showZvwEmployerNote: facts?.employeeLikeZvw === true && currentZvw === 0,
    allowances: lines,
    totalAllowancesAnnualCents: totalAnnual,
    totalAllowancesMonthlyCents: totalMonthly,
    allowanceTotalExact: typeof totalAnnual === 'number',
  };
}

export type PresentFinancialImpactOptions = {
  allowances?: AllowanceSelection | null;
  holidayPayUnresolved?: boolean;
  baselineFacts?: BaselinePresentationFacts;
};

export function presentFinancialImpact(
  result: CalculatorResult | null,
  options?: PresentFinancialImpactOptions,
): FinancialImpactPresentation {
  const turnoverVsResultNote = PERSONAL_ROUTE_COPY.turnoverVsResult;
  const allowances = options?.allowances ?? null;
  const facts = options?.baselineFacts;
  if (result == null || result.status !== 'READY') {
    const extra = result?.commercialAdditionalResultCents ?? null;
    const why =
      result == null
        ? null
        : 'De financiële berekening is voor deze situatie niet beschikbaar. Ontbrekende bedragen zijn niet als €0 meegenomen.';
    return {
      status: result == null ? 'NOT_APPLICABLE' : 'UNKNOWN',
      extraResultCents: extra,
      taxDeltaCents: UNKNOWN,
      allowanceDeltaCents: UNKNOWN,
      netExtraCents: UNKNOWN,
      monthlyApproxCents: UNKNOWN,
      headline: PERSONAL_ROUTE_COPY.unknownFinancial,
      explanation: PERSONAL_ROUTE_COPY.estimateOnRules,
      turnoverVsResultNote,
      simulator: emptySimulator(extra, why),
      baseline: null,
    };
  }

  const extra = result.commercialAdditionalResultCents;
  const tax = sumKnown([result.deltas.incomeTax, result.deltas.zvw]);
  const allowanceDelta = sumKnown([
    result.deltas.healthcareAllowance,
    result.deltas.rentAllowance,
    result.deltas.childBudget,
    result.deltas.childcareAllowance,
  ]);
  const simulator = buildMoneySimulatorView(result, allowances, facts);
  const holidayUnresolved = options?.holidayPayUnresolved === true;
  const net = holidayUnresolved ? UNKNOWN : simulator.netExtraCents;
  const month = holidayUnresolved ? UNKNOWN : simulator.monthlyApproxCents;
  const holidayWhy =
    'Zonder te weten of vakantiegeld al in dit bedrag zit, kunnen we je jaarinkomen niet exact schatten. Ontbrekende vakantiebijslag is niet als €0 meegenomen.';

  if (holidayUnresolved || isUnknown(net) || !result.netExtraIsDefinitive) {
    const anyKnown =
      knownNumber(tax) != null || knownNumber(allowanceDelta) != null || extra !== 0;
    const holidaySimulator = holidayUnresolved
      ? {
          ...simulator,
          netExtraCents: UNKNOWN,
          monthlyApproxCents: UNKNOWN,
          taxDeltaCents: UNKNOWN,
          incomeTaxDeltaCents: UNKNOWN,
          zvwDeltaCents: UNKNOWN,
          uncertaintyWhy: holidayWhy,
        }
      : simulator;
    return {
      status: anyKnown && !holidayUnresolved ? 'PARTIAL' : holidayUnresolved ? 'PARTIAL' : 'UNKNOWN',
      extraResultCents: extra,
      taxDeltaCents: holidayUnresolved ? UNKNOWN : tax,
      allowanceDeltaCents: holidayUnresolved ? UNKNOWN : allowanceDelta,
      netExtraCents: UNKNOWN,
      monthlyApproxCents: UNKNOWN,
      headline: holidaySimulator.uncertaintyWhy ?? PERSONAL_ROUTE_COPY.unknownFinancial,
      explanation: PERSONAL_ROUTE_COPY.estimateOnRules,
      turnoverVsResultNote,
      simulator: holidaySimulator,
      baseline: buildCurrentBaselineView(result, allowances, facts),
    };
  }

  return {
    status: 'EXACT',
    extraResultCents: extra,
    taxDeltaCents: tax,
    allowanceDeltaCents: allowanceDelta,
    netExtraCents: net,
    monthlyApproxCents: isUnknown(month) ? UNKNOWN : month,
    headline: PERSONAL_ROUTE_COPY.progressHeadline,
    explanation: PERSONAL_ROUTE_COPY.estimateOnRules,
    turnoverVsResultNote,
    simulator,
    baseline: buildCurrentBaselineView(result, allowances, facts),
  };
}
