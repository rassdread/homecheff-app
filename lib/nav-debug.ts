/**
 * Alleen in development: tap-doelen en navigatie debuggen (geen productielogs).
 */
export function navDebug(target: string, detail?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'development') return;
  if (typeof console === 'undefined' || !console.debug) return;
  console.debug('[nav]', target, detail ?? '');
}
