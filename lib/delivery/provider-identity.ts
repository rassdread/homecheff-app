/**
 * Delivery provider identity helpers — INDIVIDUAL vs COMPANY (DELIVERY_BUSINESS).
 */

export const PROVIDER_TYPE_INDEPENDENT = 'INDEPENDENT';
export const PROVIDER_TYPE_DELIVERY_BUSINESS = 'DELIVERY_BUSINESS';

export type DeliveryProviderType =
  | typeof PROVIDER_TYPE_INDEPENDENT
  | typeof PROVIDER_TYPE_DELIVERY_BUSINESS
  | string;

export function isDeliveryBusinessProvider(
  providerType: string | null | undefined,
): boolean {
  return String(providerType || '').toUpperCase() === PROVIDER_TYPE_DELIVERY_BUSINESS;
}

export function resolveProviderDisplayName(input: {
  providerType?: string | null;
  companyDisplayName?: string | null;
  userName?: string | null;
}): string {
  if (isDeliveryBusinessProvider(input.providerType)) {
    const company = (input.companyDisplayName || '').trim();
    if (company) return company;
  }
  return (input.userName || '').trim() || 'Bezorgpartner';
}

export function resolveProviderCardKind(
  providerType: string | null | undefined,
): 'INDIVIDUAL' | 'COMPANY' {
  return isDeliveryBusinessProvider(providerType) ? 'COMPANY' : 'INDIVIDUAL';
}
