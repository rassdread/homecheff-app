import type { CalculatorResult } from '../calculator/types';
import { isUnknown, UNKNOWN, type CentsOrUnknown } from '../domain/unknown';
import { PERSONAL_ROUTE_COPY } from './copy';
import type { FinancialImpactPresentation } from './types';

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

export function presentFinancialImpact(
  result: CalculatorResult | null,
): FinancialImpactPresentation {
  const turnoverVsResultNote = PERSONAL_ROUTE_COPY.turnoverVsResult;
  if (result == null || result.status !== 'READY') {
    return {
      status: result == null ? 'NOT_APPLICABLE' : 'UNKNOWN',
      extraResultCents: result?.commercialAdditionalResultCents ?? null,
      taxDeltaCents: UNKNOWN,
      allowanceDeltaCents: UNKNOWN,
      netExtraCents: UNKNOWN,
      monthlyApproxCents: UNKNOWN,
      headline: PERSONAL_ROUTE_COPY.unknownFinancial,
      explanation: PERSONAL_ROUTE_COPY.estimateYear,
      turnoverVsResultNote,
    };
  }

  const extra = result.commercialAdditionalResultCents;
  const tax = sumKnown([result.deltas.incomeTax, result.deltas.zvw]);
  const allowances = sumKnown([
    result.deltas.healthcareAllowance,
    result.deltas.rentAllowance,
    result.deltas.childBudget,
    result.deltas.childcareAllowance,
  ]);
  const net = result.netExtraCents;
  const month = result.netExtraPerMonthCents;

  if (isUnknown(net) || !result.netExtraIsDefinitive) {
    const anyKnown =
      knownNumber(tax) != null || knownNumber(allowances) != null || extra !== 0;
    return {
      status: anyKnown ? 'PARTIAL' : 'UNKNOWN',
      extraResultCents: extra,
      taxDeltaCents: tax,
      allowanceDeltaCents: allowances,
      netExtraCents: UNKNOWN,
      monthlyApproxCents: UNKNOWN,
      headline: PERSONAL_ROUTE_COPY.unknownFinancial,
      explanation: PERSONAL_ROUTE_COPY.estimateYear,
      turnoverVsResultNote,
    };
  }

  return {
    status: 'EXACT',
    extraResultCents: extra,
    taxDeltaCents: tax,
    allowanceDeltaCents: allowances,
    netExtraCents: net,
    monthlyApproxCents: isUnknown(month) ? UNKNOWN : month,
    headline: `Als je extra resultaat maakt, houd je naar schatting meer over.`,
    explanation: PERSONAL_ROUTE_COPY.estimateYear,
    turnoverVsResultNote,
  };
}
