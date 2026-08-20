import type Stripe from 'stripe';

import type { HcTreasuryTransferRequest, HcTreasuryTransferResult } from './types';

export type HcTreasuryTransferAdapter = {
  executeTransfer(input: HcTreasuryTransferRequest): Promise<HcTreasuryTransferResult>;
};

/** In-memory / test adapter — no Stripe network. */
export function createInMemoryHcTreasuryTransferAdapter(): HcTreasuryTransferAdapter & {
  transfers: Array<{ key: string; amountCents: number; destination: string }>;
  failNext: (errorCode: string, retryable?: boolean) => void;
  crashAfterTransfer: boolean;
  reset: () => void;
} {
  const transfers: Array<{ key: string; amountCents: number; destination: string }> = [];
  let nextFailure: { errorCode: string; retryable: boolean } | null = null;
  let crashAfterTransfer = false;

  return {
    transfers,
    get crashAfterTransfer() {
      return crashAfterTransfer;
    },
    set crashAfterTransfer(v: boolean) {
      crashAfterTransfer = v;
    },
    failNext(errorCode: string, retryable = true) {
      nextFailure = { errorCode, retryable };
    },
    reset() {
      transfers.length = 0;
      nextFailure = null;
      crashAfterTransfer = false;
    },
    async executeTransfer(input: HcTreasuryTransferRequest): Promise<HcTreasuryTransferResult> {
      const existing = transfers.find((t) => t.key === input.idempotencyKey);
      if (existing) {
        return { ok: true, transferId: `tr_sim_${input.idempotencyKey.slice(-12)}`, provider: 'STRIPE_CONNECT' };
      }
      if (nextFailure) {
        const err = nextFailure;
        nextFailure = null;
        return { ok: false, errorCode: err.errorCode, retryable: err.retryable };
      }
      if (!input.destinationAccountId.startsWith('acct_')) {
        return { ok: false, errorCode: 'PAYOUT_DESTINATION_NOT_READY', retryable: false };
      }
      transfers.push({
        key: input.idempotencyKey,
        amountCents: input.amountCents,
        destination: input.destinationAccountId,
      });
      if (crashAfterTransfer) {
        throw new Error('SIMULATED_CRASH_AFTER_TRANSFER');
      }
      return {
        ok: true,
        transferId: `tr_sim_${input.idempotencyKey.slice(-12)}`,
        provider: 'STRIPE_CONNECT',
      };
    },
  };
}

/** Stripe Connect treasury transfer — platform balance → seller destination. No buyer charge. */
export function createStripeHcTreasuryTransferAdapter(stripe: Stripe): HcTreasuryTransferAdapter {
  return {
    async executeTransfer(input: HcTreasuryTransferRequest): Promise<HcTreasuryTransferResult> {
      try {
        const transfer = await stripe.transfers.create(
          {
            amount: input.amountCents,
            currency: 'eur',
            destination: input.destinationAccountId,
            metadata: {
              paymentType: 'HC_ONLY',
              settlementSource: input.settlementSource,
              orderId: input.orderId,
              exposureId: input.exposureId,
              sellerId: input.sellerUserId,
              calculationVersion: input.calculationVersion,
            },
          },
          { idempotencyKey: input.idempotencyKey },
        );
        return { ok: true, transferId: transfer.id, provider: 'STRIPE_CONNECT' };
      } catch (e: unknown) {
        const err = e as { code?: string; type?: string; message?: string };
        const code = err.code ?? err.type ?? 'STRIPE_TRANSFER_FAILED';
        const retryable = !['invalid_request_error', 'idempotency_key_in_use'].includes(String(err.type));
        return { ok: false, errorCode: code, retryable };
      }
    },
  };
}

export async function executeHcTreasurySellerTransfer(
  adapter: HcTreasuryTransferAdapter,
  input: HcTreasuryTransferRequest,
): Promise<HcTreasuryTransferResult> {
  return adapter.executeTransfer(input);
}
