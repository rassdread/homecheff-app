/**
 * Growth central-HC marketplace mutation client — server-to-server only.
 */

export type TrustedOrderPayload = {
  orderId: string;
  listingId: string;
  sellerCentralUserId: string;
  merchantId: string;
  categoryKey: string;
  geographyKey: string;
  orderTotalCents: number;
};

function growthBaseUrl(): string | null {
  const base = (process.env.GROWTH_HC_QUOTE_BASE_URL ?? process.env.GROWTH_API_BASE_URL ?? '').replace(/\/$/, '');
  return base || null;
}

function internalSecret(): string | null {
  const secret = (
    process.env.HC_MARKETPLACE_MUTATION_INTERNAL_SECRET ??
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ??
    ''
  ).trim();
  return secret || null;
}

async function postGrowth<T>(path: string, body: unknown): Promise<T | null> {
  const base = growthBaseUrl();
  const secret = internalSecret();
  if (!base || !secret) return null;

  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function growthReserveMarketplaceHc(input: {
  centralUserId: string;
  trustedOrder: TrustedOrderPayload;
  amountHc: number;
}): Promise<
  | { ok: true; reservationId: string; duplicate: boolean; amountHc: number }
  | { ok: false; code: string; message: string }
  | null
> {
  return postGrowth('/api/internal/marketplace/hc/reserve', input);
}

export async function growthCaptureMarketplaceHc(input: {
  centralUserId: string;
  orderId: string;
  reservationId: string;
}): Promise<{ ok: true; duplicate: boolean; capturedHc: number } | { ok: false; code: string; message: string } | null> {
  return postGrowth('/api/internal/marketplace/hc/capture', input);
}

export type GrowthReleaseReason =
  | 'SELLER_REJECTED'
  | 'BUYER_CANCELLED'
  | 'ORDER_CREATE_FAILED'
  | 'FULFILLMENT_FAILED_BEFORE_CAPTURE'
  | 'ADMIN_CANCELLED';

export async function growthReleaseMarketplaceHc(input: {
  centralUserId: string;
  orderId: string;
  reservationId: string;
  reason: GrowthReleaseReason;
}): Promise<{ ok: true; duplicate: boolean; releasedHc: number } | { ok: false; code: string; message: string } | null> {
  return postGrowth('/api/internal/marketplace/hc/release', input);
}

export { fetchGrowthMarketplaceHcQuote } from '@/lib/hc/growth-marketplace-quote-client';
