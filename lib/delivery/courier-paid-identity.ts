import { COURIER_TRANSFER_FRESH_MS } from '@/lib/delivery/courier-connect-eligibility';
import type { CourierVerificationState } from '@/lib/delivery/courier-identity';

export function paidIdentityAllowsDelivery(input: {
  state: CourierVerificationState | string | null | undefined;
  checkedAt: Date | null | undefined;
  now: Date;
  suspended?: boolean;
  freshMs?: number;
}): boolean {
  if (input.suspended) return false;
  if (input.state !== 'VERIFIED' || !input.checkedAt) return false;
  const age = input.now.getTime() - input.checkedAt.getTime();
  const freshMs = input.freshMs ?? COURIER_TRANSFER_FRESH_MS;
  return age >= 0 && age <= freshMs;
}

export function paidIdentityDenial(input: {
  state: CourierVerificationState | string | null | undefined;
  checkedAt: Date | null | undefined;
  now?: Date;
  suspended?: boolean;
}):
  | { ok: true }
  | { ok: false; status: 403; code: 'DELIVERY_IDENTITY_REQUIRED'; error: string; errorEn: string; state: string } {
  const now = input.now ?? new Date();
  if (
    paidIdentityAllowsDelivery({
      state: input.state,
      checkedAt: input.checkedAt,
      now,
      suspended: input.suspended,
    })
  ) {
    return { ok: true };
  }
  return {
    ok: false,
    status: 403,
    code: 'DELIVERY_IDENTITY_REQUIRED',
    state: input.suspended ? 'RESTRICTED' : input.state || 'UNKNOWN',
    error:
      'Betaalde bezorging is gesloten tot Stripe de identiteitscontrole als afgerond meldt. Een ingeschakelde uitbetaling is niet genoeg.',
    errorEn:
      'Paid delivery stays closed until Stripe reports the identity check as verified. Enabled payouts are not enough.',
  };
}
