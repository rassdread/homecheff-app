/** Non-refundable credits: net box-1 tax cannot go below 0. */

export function netIncomeTaxAfterCredits(input: {
  taxBeforeCreditsCents: number;
  generalTaxCreditCents: number;
  employmentTaxCreditCents: number;
  additionalCreditsCents?: number;
}): number {
  const extra = input.additionalCreditsCents ?? 0;
  const net =
    input.taxBeforeCreditsCents -
    input.generalTaxCreditCents -
    input.employmentTaxCreditCents -
    extra;
  return net < 0 ? 0 : net;
}
