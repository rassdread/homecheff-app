/**
 * Private delivery certification scope.
 * Cert providers are matchable only to allowlisted buyers (Steve / cert sessions).
 * Normal customers never see them — no fake public supply.
 */

const CERT_PROVIDER_USER_IDS = new Set(
  (process.env.DELIVERY_CERT_PROVIDER_USER_IDS ||
    // Default Production controlled recipient: r.sergio
    '7647bf21-e9ab-4e3a-af83-eeec23e24dcb')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const CERT_BUYER_USER_IDS = new Set(
  (process.env.DELIVERY_CERT_BUYER_USER_IDS ||
    // Default Production controlled buyer: Steve
    'c54bbbcf-1323-4539-8e30-c2a6b7f95662')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

export function isDeliveryCertProviderUserId(userId: string | null | undefined): boolean {
  return Boolean(userId && CERT_PROVIDER_USER_IDS.has(userId));
}

export function isDeliveryCertBuyerUserId(userId: string | null | undefined): boolean {
  return Boolean(userId && CERT_BUYER_USER_IDS.has(userId));
}

/**
 * Whether a provider profile may appear in a match list for this buyer.
 * Non-cert providers: always (subject to other commercial gates).
 * Cert providers: only for cert buyers.
 */
export function isProviderVisibleToBuyer(args: {
  providerUserId: string;
  buyerUserId?: string | null;
}): boolean {
  if (!isDeliveryCertProviderUserId(args.providerUserId)) return true;
  return isDeliveryCertBuyerUserId(args.buyerUserId);
}

export const DELIVERY_CERT_ORDER_META_KEY = 'homecheffDeliveryCert';
export const DELIVERY_CERT_ORDER_META_VALUE = 'controlled_financial_e2e_v1';

export function isDeliveryCertOrderMeta(
  meta: Record<string, unknown> | null | undefined,
): boolean {
  return meta?.[DELIVERY_CERT_ORDER_META_KEY] === DELIVERY_CERT_ORDER_META_VALUE;
}
