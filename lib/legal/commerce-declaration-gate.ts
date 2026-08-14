/**
 * LEGAL-1 — when a commerce self-declaration is required before publish.
 * Free / ON_REQUEST / VOLUNTARY / BARTER_ONLY are not commerce-gated here.
 */

export type CommerceDeclarationGateInput = {
  priceCents: number;
  priceModel?: string | null;
  barterOpenness?: string | null;
  acceptHomeCheffPayment?: boolean;
};

export const COMMERCE_DECLARATION_REQUIRED_CODE =
  'COMMERCE_DECLARATION_REQUIRED' as const;

/**
 * True only for paid money offers. Not a legal-trader test.
 */
export function offerRequiresCommerceDeclaration(
  input: CommerceDeclarationGateInput,
): boolean {
  const openness = (input.barterOpenness || '').toUpperCase();
  if (openness === 'BARTER_ONLY') return false;

  const model = (input.priceModel || '').toUpperCase();
  if (model === 'ON_REQUEST' || model === 'VOLUNTARY') return false;

  return (input.priceCents ?? 0) > 0;
}
