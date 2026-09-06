/**
 * EctaroShip integration entry — Partner API only.
 * Legacy calculate/label paths removed; use lib/ectaroship/partner-client.ts
 */

export {
  ECTAROSHIP_PARTNER_BASE_URL as ECTAROSHIP_API_BASE_URL,
  HOMECHEFF_SHIPPING_MARKUP_PERCENT,
  isEctaroShipConfigured,
  getShippingProducts,
  createPartnerLabel as createShippingLabel,
  cancelPartnerLabel,
  checkRemoteArea,
  listShippingLabels,
  pingPartnerApi,
  isAllowedEctaroDocumentUrl,
  type ShippingProduct,
  type CreateLabelParams,
  type CreatedLabel,
  type GetProductsParams,
} from '@/lib/ectaroship/partner-client';

/** @deprecated Official Partner API has no webhooks — use status sync cron. */
export function verifyWebhookSignature(
  _payload: string,
  _signature: string,
  _secret?: string,
): boolean {
  return false;
}
