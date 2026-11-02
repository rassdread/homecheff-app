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
 * Smallest safe default: allow quote checkout, surface risk, do not auto-disable.
 * Flip to hard-block only when SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH=true (explicit).
 */
export function shippingCheckoutShouldHardBlock(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const requirePath = env.SHIPPING_CHECKOUT_REQUIRES_LABEL_PATH;
  if (typeof requirePath !== 'string') return false;
  const on = ['1', 'true', 'yes'].includes(requirePath.trim().toLowerCase());
  return on && !shippingLabelsCertified(env);
}
