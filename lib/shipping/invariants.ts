/** Pure shipping financial invariants (no DB / provider imports). */

export function assertClientShippingQuoteMatches(
  clientQuotedFeeCents: number | null | undefined,
  serverPriceCents: number,
):
  | { ok: true }
  | { ok: false; code: string; error: string; quotedFeeCents: number } {
  if (clientQuotedFeeCents == null || !Number.isFinite(clientQuotedFeeCents)) {
    return { ok: true };
  }
  const client = Math.round(clientQuotedFeeCents);
  if (client !== serverPriceCents) {
    return {
      ok: false,
      code: 'SHIPPING_QUOTE_CHANGED',
      error: 'Verzendprijs is gewijzigd. Bevestig de nieuwe prijs.',
      quotedFeeCents: serverPriceCents,
    };
  }
  return { ok: true };
}

/**
 * Invariant: never create a billable shipment when buyer shipping charge is €0
 * unless explicitly FREE_SHIPPING (not implemented — always block).
 */
export function assertShippingChargeBeforeBillableLabel(
  shippingCostCents: number | null | undefined,
): boolean {
  return typeof shippingCostCents === 'number' && shippingCostCents > 0;
}
