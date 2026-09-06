/** Structured shipping observability — never log API keys or full PII. */

export type ShippingEventName =
  | 'SHIPPING_QUOTE_REQUESTED'
  | 'SHIPPING_QUOTE_SUCCEEDED'
  | 'SHIPPING_QUOTE_FAILED'
  | 'SHIPPING_REQUOTED'
  | 'SHIPPING_PRICE_CHANGED'
  | 'SHIPMENT_CREATE_STARTED'
  | 'SHIPMENT_CREATE_SUCCEEDED'
  | 'SHIPMENT_CREATE_FAILED'
  | 'SHIPMENT_SYNC_UPDATED'
  | 'SHIPPING_COST_RECONCILED'
  | 'SHIPPING_NEGATIVE_MARGIN';

export function logShippingEvent(
  event: ShippingEventName,
  fields: Record<string, string | number | boolean | null | undefined>,
): void {
  const safe: Record<string, string | number | boolean | null> = { event };
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    const keyLower = k.toLowerCase();
    if (
      keyLower.includes('key') ||
      keyLower.includes('secret') ||
      keyLower.includes('authorization') ||
      keyLower.includes('password')
    ) {
      continue;
    }
    safe[k] = v;
  }
  console.log(JSON.stringify(safe));
}
