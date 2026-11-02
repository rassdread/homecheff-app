/**
 * EctaroShip quotes can be live while label creation is not certified.
 * Do not treat API-key presence as label-path readiness.
 *
 * Optional future gate (owner approval required before enabling):
 *   SHIPPING_LABELS_CERTIFIED=true
 */

export function shippingLabelsCertified(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env.SHIPPING_LABELS_CERTIFIED;
  if (typeof raw !== 'string') return false;
  return ['1', 'true', 'yes', 'certified'].includes(raw.trim().toLowerCase());
}

/**
 * Public parcel checkout stays closed until a printable carrier label is certified.
 * Quotes are unaffected. An explicit SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH=false
 * is the only owner override that opens checkout without certification.
 */
export function shippingCheckoutShouldHardBlock(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (shippingLabelsCertified(env)) return false;
  const requirePath = env.SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH;
  if (typeof requirePath === 'string') {
    const value = requirePath.trim().toLowerCase();
    if (['0', 'false', 'no', 'off'].includes(value)) return false;
  }
  return true;
}
