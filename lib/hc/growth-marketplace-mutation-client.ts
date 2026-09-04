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
  const res = await postGrowthRaw<T>(path, body);
  if (!res) return null;
  // Return JSON body for both 2xx and structured 4xx so callers can read { ok:false, code }.
  return res.data;
}

async function postGrowthRaw<T>(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; data: T } | null> {
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
  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    return null;
  }
  return { ok: res.ok, status: res.status, data };
}

export async function growthReserveMarketplaceHc(input: {
  centralUserId: string;
  trustedOrder: TrustedOrderPayload;
  amountHc: number;
  billingMode?: 'HC_ONLY' | 'MIXED_HC_EUR';
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

export async function growthRefundMarketplaceHc(input: {
  centralUserId: string;
  orderId: string;
  reservationId: string;
  refundId: string;
}): Promise<
  | { ok: true; duplicate: boolean; restoredHc: number; ledgerEntryId?: string }
  | { ok: false; code: string; message?: string }
  | null
> {
  return postGrowth('/api/internal/marketplace/hc/refund', input);
}

export type GrowthFeeSnapshotResponse = {
  ok: boolean;
  code?: string;
  message?: string;
  engineLive?: boolean;
  path?: 'SNAPSHOT_PRESENT' | 'LEGACY_NO_SNAPSHOT';
  duplicate?: boolean;
  fee?: {
    baseSellerFeeBps: number;
    effectiveSellerFeeBps: number;
    feeSourceType: string;
    programId: string | null;
    calculationVersion: string;
    reason: string;
  };
  snapshot?: {
    orderId: string;
    sellerCentralUserId: string;
    orderTotalCents: number;
    baseSellerFeeBps: number;
    effectiveSellerFeeBps: number;
    platformFeeCents: number;
    sellerNetExposureCents: number;
    feeSourceType: string;
    programId: string | null;
    programName: string | null;
    programSlug: string | null;
    calculationVersion: string;
    paymentMethod: string;
  } | null;
};

export async function growthResolveMarketplaceFeeSnapshot(input: {
  orderId: string;
  sellerCentralUserId: string;
  orderTotalCents: number;
  paymentMethod: 'HC_ONLY' | 'EUR_STRIPE' | 'MIXED_HC_EUR' | 'MEAL_CREDIT';
  categoryKey: string;
  geographyKey: string;
  persist: boolean;
}): Promise<GrowthFeeSnapshotResponse | { ok: false; code: 'GROWTH_UNAVAILABLE' } | null> {
  const res = await postGrowthRaw<GrowthFeeSnapshotResponse>('/api/internal/marketplace/hc/fee-snapshot', {
    action: 'resolve',
    ...input,
  });
  if (!res) return { ok: false, code: 'GROWTH_UNAVAILABLE' };
  return res.data;
}

export async function growthRollbackMarketplaceFeeSnapshot(orderId: string): Promise<void> {
  await postGrowthRaw('/api/internal/marketplace/hc/fee-snapshot', { action: 'rollback', orderId });
}

export { fetchGrowthMarketplaceHcQuote } from '@/lib/hc/growth-marketplace-quote-client';
