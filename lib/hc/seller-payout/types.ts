/** HC seller payout calculation + idempotency version. */
export const HC_SELLER_PAYOUT_CALCULATION_VERSION = 'hc_seller_payout_v1_20260820' as const;

export const HC_SELLER_PAYOUT_IDEMPOTENCY_VERSION = 'v1' as const;

export type HcSellerPayoutEligibilityCode =
  | 'ELIGIBLE'
  | 'EXPOSURE_NOT_FOUND'
  | 'EXPOSURE_STATUS_NOT_PAYABLE'
  | 'EXPOSURE_ALREADY_PAID'
  | 'PAYOUT_IN_PROGRESS'
  | 'ORDER_NOT_COMPLETED'
  | 'HC_CAPTURE_NOT_FINAL'
  | 'ORDER_NOT_HC_ONLY'
  | 'ORDER_REFUNDED_OR_REVERSED'
  | 'PAYABLE_AMOUNT_INVALID'
  | 'SETTLEMENT_SOURCE_UNSUPPORTED'
  | 'SELLER_MISMATCH'
  | 'PAYOUT_DESTINATION_NOT_READY'
  | 'PAYOUT_ENGINE_DISABLED'
  | 'PAYOUT_PRODUCTION_MUTATION_DISABLED'
  | 'REFUND_AFTER_PAYOUT_POLICY_REQUIRED';

export type HcSellerPayoutExposureStatus =
  | 'PENDING'
  | 'EARNED'
  | 'PAYOUT_PENDING'
  | 'PAID'
  | 'PAYOUT_FAILED_RETRYABLE'
  | 'PAYOUT_BLOCKED'
  | 'VOID'
  | 'REVERSED';

export const HC_SELLER_PAYOUT_PAYABLE_STATUSES: HcSellerPayoutExposureStatus[] = [
  'EARNED',
  'PAYOUT_FAILED_RETRYABLE',
];

export type HcSellerPayoutExposureView = {
  id: string;
  orderId: string;
  sellerUserId: string;
  buyerCentralUserId: string;
  status: HcSellerPayoutExposureStatus;
  grossOrderCents: number;
  theoreticalPlatformFeeCents: number;
  sellerNetExposureCents: number;
  payableAmountCents: number | null;
  settlementSource: 'HOMECHEFF_TREASURY' | 'ORGANIZATION_PROGRAM';
  payoutReference: string | null;
  payoutIdempotencyKey: string | null;
  paidAt: Date | null;
  calculationVersion: string | null;
  feeSourceType: string | null;
  effectiveSellerFeeBps: number | null;
};

export type HcSellerPayoutOrderView = {
  id: string;
  status: string;
  paymentMethod: string | null;
  hcPaymentPhase: string | null;
  hcCapturedHc: number | null;
  stripeSessionId: string | null;
  sellerUserId: string;
};

export type HcSellerPayoutSellerView = {
  id: string;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
};

export type HcSellerPayoutEligibilityInput = {
  exposure: HcSellerPayoutExposureView;
  order: HcSellerPayoutOrderView;
  seller: HcSellerPayoutSellerView;
  engineEnabled: boolean;
  productionMutationEnabled: boolean;
  isProductionDatabase: boolean;
  expectedSellerUserId?: string;
  expectedAmountCents?: number;
};

export type HcSellerPayoutEligibilityResult = {
  eligible: boolean;
  code: HcSellerPayoutEligibilityCode;
  payableAmountCents: number;
  destinationAccountId: string | null;
  idempotencyKey: string;
};

export type HcTreasuryTransferRequest = {
  exposureId: string;
  orderId: string;
  sellerUserId: string;
  amountCents: number;
  destinationAccountId: string;
  idempotencyKey: string;
  calculationVersion: string;
  settlementSource: string;
};

export type HcTreasuryTransferResult =
  | { ok: true; transferId: string; provider: 'STRIPE_CONNECT' }
  | { ok: false; errorCode: string; retryable: boolean };

export type HcSellerPayoutExecuteResult =
  | {
      ok: true;
      duplicate: boolean;
      exposureId: string;
      amountCents: number;
      transferId: string;
      status: 'PAID';
    }
  | {
      ok: false;
      code: HcSellerPayoutEligibilityCode | string;
      exposureId?: string;
      status?: HcSellerPayoutExposureStatus;
      retryable?: boolean;
    };
