/**
 * Pure delivery-registration source record. No database and no affiliate cookies.
 */
import type { MarketplaceUtmCapture } from '@/lib/acquisition/utm-persistence';

export const DELIVERY_REGISTRATION_SOURCE_EVENT = 'DELIVERY_REGISTRATION_SOURCE';

export type DeliveryRegistrationSourceRecord = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  landing_path?: string;
  captured_at?: string;
  provider_type: 'INDEPENDENT' | 'DELIVERY_BUSINESS';
  delivery_region?: string;
  registered_at: string;
};

/** Place name only. Rejects emails, street numbers and markup. */
export function scrubDeliveryRegion(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().replace(/\s+/g, ' ');
  if (value.length < 2 || value.length > 80) return null;
  if (value.includes('@') || /[<>"`\\]/.test(value)) return null;
  if (!/^[\p{L}\s.'’-]{2,80}$/u.test(value)) return null;
  return value;
}

export function buildDeliveryRegistrationSource(input: {
  capture: MarketplaceUtmCapture | null;
  providerType: string;
  deliveryRegion: string | null;
  registeredAt: string;
}): DeliveryRegistrationSourceRecord {
  const record: DeliveryRegistrationSourceRecord = {
    provider_type:
      input.providerType === 'DELIVERY_BUSINESS' ? 'DELIVERY_BUSINESS' : 'INDEPENDENT',
    registered_at: input.registeredAt,
  };
  const capture = input.capture;
  if (capture?.utm_source) record.utm_source = capture.utm_source;
  if (capture?.utm_medium) record.utm_medium = capture.utm_medium;
  if (capture?.utm_campaign) record.utm_campaign = capture.utm_campaign;
  if (capture?.utm_content) record.utm_content = capture.utm_content;
  if (capture?.landing_path) record.landing_path = capture.landing_path;
  if (capture?.captured_at) record.captured_at = capture.captured_at;
  if (input.deliveryRegion) record.delivery_region = input.deliveryRegion;
  return record;
}
