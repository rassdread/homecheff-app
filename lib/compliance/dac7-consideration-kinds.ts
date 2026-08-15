/**
 * LEGAL-4A — barter / free / voluntary treatment for DAC7 derive.
 */

export type Dac7ConsiderationKind =
  | 'MONETARY_CAPTURED'
  | 'NON_MONETARY_CONSIDERATION'
  | 'FREE_OR_ZERO'
  | 'UNPAID_DEAL_LIFECYCLE'
  | 'COUNSEL_REQUIRED_FOR_DAC7_VALUATION';

export function classifyBarterOpennessForDac7(
  barterOpenness: string | null | undefined,
  hasCapturedMoney: boolean,
): {
  moneyLeg: Dac7ConsiderationKind | null;
  barterLeg: Dac7ConsiderationKind | null;
} {
  const b = (barterOpenness || 'MONEY').toUpperCase();
  if (b === 'BARTER_ONLY') {
    return {
      moneyLeg: null,
      barterLeg: 'COUNSEL_REQUIRED_FOR_DAC7_VALUATION',
    };
  }
  if (b === 'MONEY_AND_BARTER') {
    return {
      moneyLeg: hasCapturedMoney
        ? 'MONETARY_CAPTURED'
        : 'UNPAID_DEAL_LIFECYCLE',
      barterLeg: 'COUNSEL_REQUIRED_FOR_DAC7_VALUATION',
    };
  }
  return {
    moneyLeg: hasCapturedMoney ? 'MONETARY_CAPTURED' : 'FREE_OR_ZERO',
    barterLeg: null,
  };
}

export function classifyPriceModelForDac7(input: {
  priceModel?: string | null;
  priceCents?: number | null;
  hasCapturedMoney: boolean;
}): Dac7ConsiderationKind {
  if (input.hasCapturedMoney) return 'MONETARY_CAPTURED';
  const model = (input.priceModel || '').toUpperCase();
  if (model === 'VOLUNTARY') return 'FREE_OR_ZERO';
  if ((input.priceCents ?? 0) <= 0) return 'FREE_OR_ZERO';
  return 'UNPAID_DEAL_LIFECYCLE';
}
