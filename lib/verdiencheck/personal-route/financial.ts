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
  FinancialImpactPresentation,
  MoneySimulatorView,
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
  const allowancesUnknown = Boolean(allowances?.includes('UNKNOWN'));
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
    return {
      id: meta.id,
      included: false,
      currentCents: null,
      scenarioCents: null,
      deltaCents: null,
      rightLost: false,
      unchanged: false,
      unknown: false,
      excludedReason: allowancesUnknown
        ? 'Je weet niet of je toeslagen ontvangt. Toeslagen zijn daarom niet meegenomen.'
        : null,
    };
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
    excludedReason: null,
  };
}

function uncertaintyFromMissing(missing: readonly string[], allowances: AllowanceSelection | null): string | null {
  if (missing.includes('baselineBox1TaxableIncomeCents') || missing.includes('baselineAggregateIncomeCents') || missing.includes('baselineArbeidsinkomenCents') || missing.includes('baselineAssessmentIncomeCents')) {
    return 'Je huidige inkomen is niet volledig bekend. Daardoor is deze uitkomst een indicatie. Ontbrekende bedragen zijn niet als €0 meegenomen.';
  }
  if (missing.includes('allowances') || allowances?.includes('UNKNOWN')) {
    return 'Je weet niet of je toeslagen ontvangt. Toeslagen zijn daarom niet meegenomen.';
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
    allowances: ALLOWANCE_META.map((meta) => ({
      id: meta.id,
      included: false,
      currentCents: null,
      scenarioCents: null,
      deltaCents: null,
      rightLost: false,
      unchanged: false,
      unknown: false,
      excludedReason: null,
    })),
    netExtraCents: UNKNOWN,
    monthlyApproxCents: UNKNOWN,
    netFromEngine: true,
    includedNotes: [],
    excludedNotes: uniqueNotes([why]),
    uncertaintyWhy: why,
  };
}

export function buildMoneySimulatorView(
  result: CalculatorReadyResult,
  allowances: AllowanceSelection | null,
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
  return {
    extraResultCents: extra,
    taxDeltaCents: tax,
    incomeTaxDeltaCents: result.deltas.incomeTax,
    zvwDeltaCents: result.deltas.zvw,
    allowances: lines,
    netExtraCents: isUnknown(net) || !result.netExtraIsDefinitive ? UNKNOWN : net,
    monthlyApproxCents: isUnknown(month) || !result.netExtraIsDefinitive ? UNKNOWN : month,
    netFromEngine: true,
    includedNotes,
    excludedNotes: uniqueNotes(excluded.map((line) => line.excludedReason)),
    uncertaintyWhy: why,
  };
}

export function presentFinancialImpact(
  result: CalculatorResult | null,
  options?: { allowances?: AllowanceSelection | null },
): FinancialImpactPresentation {
  const turnoverVsResultNote = PERSONAL_ROUTE_COPY.turnoverVsResult;
  const allowances = options?.allowances ?? null;
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
  const simulator = buildMoneySimulatorView(result, allowances);
  const net = simulator.netExtraCents;
  const month = simulator.monthlyApproxCents;

  if (isUnknown(net) || !result.netExtraIsDefinitive) {
    const anyKnown =
      knownNumber(tax) != null || knownNumber(allowanceDelta) != null || extra !== 0;
    return {
      status: anyKnown ? 'PARTIAL' : 'UNKNOWN',
      extraResultCents: extra,
      taxDeltaCents: tax,
      allowanceDeltaCents: allowanceDelta,
      netExtraCents: UNKNOWN,
      monthlyApproxCents: UNKNOWN,
      headline: simulator.uncertaintyWhy ?? PERSONAL_ROUTE_COPY.unknownFinancial,
      explanation: PERSONAL_ROUTE_COPY.estimateOnRules,
      turnoverVsResultNote,
      simulator,
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
  };
}
