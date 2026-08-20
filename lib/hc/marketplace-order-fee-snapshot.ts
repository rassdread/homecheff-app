export type MarketplaceOrderFeeSnapshotDto = {
  orderId: string;
  sellerCentralUserId: string;
  orderTotalCents: number;
  baseSellerFeeBps: number;
  effectiveSellerFeeBps: number;
  platformFeeCents: number;
  sellerNetExposureCents: number;
  feeSourceType: string;
  programId: string | null;
  programName?: string | null;
  programSlug?: string | null;
  calculationVersion: string;
  paymentMethod: string;
};

export type FeeSnapshotPath = 'SNAPSHOT_PRESENT' | 'LEGACY_NO_SNAPSHOT';

export function computePlatformFeeCentsFromBps(orderTotalCents: number, feeBps: number): number {
  return Math.round((orderTotalCents * feeBps) / 10_000);
}

export function sellerNetFromFee(orderTotalCents: number, platformFeeCents: number): number {
  return Math.max(0, orderTotalCents - platformFeeCents);
}

/** Client-submitted fee/program fields are never used. */
export function stripSpoofedFeeFields<T extends Record<string, unknown>>(body: T): T {
  const next = { ...body };
  delete next.effectiveSellerFeeBps;
  delete next.baseSellerFeeBps;
  delete next.programId;
  delete next.platformFeeCents;
  delete next.sellerNetCents;
  delete next.feeSourceType;
  delete next.sellerTier;
  return next;
}

export function exposureFromSnapshot(input: {
  hcCaptured: number;
  grossOrderCents: number;
  snapshot: MarketplaceOrderFeeSnapshotDto;
}) {
  return {
    path: 'SNAPSHOT_PRESENT' as const,
    hcFaceValueCents: input.hcCaptured,
    theoreticalPlatformFeeCents: input.snapshot.platformFeeCents,
    sellerGrossEntitlementCents: input.snapshot.sellerNetExposureCents,
    sellerNetExposureCents: input.snapshot.sellerNetExposureCents,
    platformFeeBps: input.snapshot.effectiveSellerFeeBps,
    feeSourceType: input.snapshot.feeSourceType,
    programId: input.snapshot.programId,
    calculationVersion: input.snapshot.calculationVersion,
    settlementSource: 'HOMECHEFF_TREASURY' as const,
    platformFeePolicy: 'ORDER_FEE_SNAPSHOT',
  };
}

export function exposureFromLegacyBps(input: {
  hcCaptured: number;
  grossOrderCents: number;
  platformFeeBps: number;
}) {
  const theoreticalPlatformFeeCents = computePlatformFeeCentsFromBps(
    input.grossOrderCents,
    input.platformFeeBps,
  );
  const sellerNet = sellerNetFromFee(input.grossOrderCents, theoreticalPlatformFeeCents);
  return {
    path: 'LEGACY_NO_SNAPSHOT' as const,
    hcFaceValueCents: input.hcCaptured,
    theoreticalPlatformFeeCents,
    sellerGrossEntitlementCents: sellerNet,
    sellerNetExposureCents: sellerNet,
    platformFeeBps: input.platformFeeBps,
    feeSourceType: 'SUBSCRIPTION_TIER',
    programId: null as string | null,
    calculationVersion: null as string | null,
    settlementSource: 'HOMECHEFF_TREASURY' as const,
    platformFeePolicy: 'THEORETICAL_POLICY_PENDING',
  };
}

export function parseStoredHcFeeSnapshot(raw: unknown): MarketplaceOrderFeeSnapshotDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const orderId = typeof o.orderId === 'string' ? o.orderId : '';
  const effectiveSellerFeeBps = Math.floor(Number(o.effectiveSellerFeeBps));
  const platformFeeCents = Math.floor(Number(o.platformFeeCents));
  const sellerNetExposureCents = Math.floor(Number(o.sellerNetExposureCents));
  if (!orderId || !Number.isFinite(effectiveSellerFeeBps) || !Number.isFinite(platformFeeCents)) return null;
  return {
    orderId,
    sellerCentralUserId: String(o.sellerCentralUserId ?? ''),
    orderTotalCents: Math.floor(Number(o.orderTotalCents)),
    baseSellerFeeBps: Math.floor(Number(o.baseSellerFeeBps)),
    effectiveSellerFeeBps,
    platformFeeCents,
    sellerNetExposureCents,
    feeSourceType: String(o.feeSourceType ?? 'SUBSCRIPTION_TIER'),
    programId: o.programId == null ? null : String(o.programId),
    programName: o.programName == null ? null : String(o.programName),
    programSlug: o.programSlug == null ? null : String(o.programSlug),
    calculationVersion: String(o.calculationVersion ?? ''),
    paymentMethod: String(o.paymentMethod ?? 'HC_ONLY'),
  };
}
