/**
 * LEGAL-4A — DAC7 goods threshold helpers (deterministic, pure).
 * Threshold is DAC7 reporting logic only — never LEGAL-1 trader classification.
 */

/** Calendar-year goods exclusion: BOTH conditions required. */
export const DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE = 30;
export const DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE = 200_000; // EUR 2,000

export type Dac7GoodsYearTotals = {
  year: number;
  transactionCount: number;
  grossConsiderationCents: number;
  refundCents: number;
  netConsiderationCents: number;
  platformFeesCents: number;
};

export function isExcludedGoodsSeller(totals: {
  transactionCount: number;
  netConsiderationCents: number;
}): boolean {
  return (
    totals.transactionCount < DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE &&
    totals.netConsiderationCents <=
      DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE
  );
}

export function computeNetConsiderationCents(input: {
  grossConsiderationCents: number;
  refundCents: number;
}): number {
  return Math.max(
    0,
    input.grossConsiderationCents - Math.max(0, input.refundCents),
  );
}

export function computePlatformFeesCents(input: {
  amountCents: number;
  platformFeeBps: number;
}): number {
  const bps = Math.max(0, input.platformFeeBps);
  return Math.round((input.amountCents * bps) / 10_000);
}

export function buildGoodsYearTotals(input: {
  year: number;
  transactionCount: number;
  grossConsiderationCents: number;
  refundCents: number;
  platformFeesCents: number;
}): Dac7GoodsYearTotals {
  const net = computeNetConsiderationCents({
    grossConsiderationCents: input.grossConsiderationCents,
    refundCents: input.refundCents,
  });
  return {
    year: input.year,
    transactionCount: input.transactionCount,
    grossConsiderationCents: input.grossConsiderationCents,
    refundCents: input.refundCents,
    netConsiderationCents: net,
    platformFeesCents: input.platformFeesCents,
  };
}
