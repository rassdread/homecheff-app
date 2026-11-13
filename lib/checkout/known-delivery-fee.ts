export type CheckoutDeliveryQuote = {
  deliveryFeeCents?: number | null;
  selectionRequired?: boolean;
  shippingMethodId?: string | null;
  withinFreeRadius?: boolean | null;
};

/**
 * A checkout total may include €0 only for pickup or a quote the server marked
 * as intentionally free. A missing courier selection is not free delivery.
 */
export function knownCheckoutDeliveryFeeCents(input: {
  selectedDelivery: string;
  addressValidated: boolean;
  quote: CheckoutDeliveryQuote | null;
  optionPrice?: number | null;
}): number | null {
  const mode = input.selectedDelivery;
  if (!mode || mode === 'pickup') {
    return Math.round((input.optionPrice ?? 0) * 100);
  }
  const quote = input.quote;
  if (
    !input.addressValidated ||
    !quote ||
    quote.selectionRequired ||
    typeof quote.deliveryFeeCents !== 'number' ||
    !Number.isFinite(quote.deliveryFeeCents)
  ) {
    return null;
  }
  if (quote.deliveryFeeCents > 0) return Math.round(quote.deliveryFeeCents);
  if (quote.withinFreeRadius === true) return 0;
  if (mode === 'shipping' && quote.shippingMethodId) return 0;
  return null;
}
