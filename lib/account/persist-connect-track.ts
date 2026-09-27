import type { AccountAgeMode, AccountConnectTrack } from '@/lib/account/account-completion';

export type ConnectTrackPersistDecision =
  | { ok: true; track: AccountConnectTrack; unchanged: boolean }
  | {
      ok: false;
      status: number;
      code: string;
      messageNl: string;
      messageEn: string;
    };

/**
 * Decide whether the signed-in user may store a seller type before Stripe.
 * Does not create a Connect account and never switches an account that already exists.
 */
export function decideConnectTrackPersist(input: {
  requested: AccountConnectTrack;
  ageMode: AccountAgeMode;
  hasStripeAccount: boolean;
  existingTrack: AccountConnectTrack | null;
}): ConnectTrackPersistDecision {
  if (input.hasStripeAccount) {
    if (input.existingTrack && input.existingTrack !== input.requested) {
      return {
        ok: false,
        status: 409,
        code: 'TRACK_LOCKED',
        messageNl: 'Je betaalaccount staat al. Het type kan hier niet worden gewisseld.',
        messageEn: 'Your payment account already exists. The type cannot be switched here.',
      };
    }
    return {
      ok: true,
      track: input.existingTrack ?? input.requested,
      unchanged: true,
    };
  }

  if (input.ageMode === 'BLOCKED_UNDER_13') {
    return {
      ok: false,
      status: 403,
      code: 'UNDER_13',
      messageNl: 'Een betaalaccount is niet beschikbaar onder 13 jaar.',
      messageEn: 'A payment account is not available under 13.',
    };
  }

  if (
    input.requested === 'BUSINESS' &&
    (input.ageMode === 'MINOR' || input.ageMode === 'DOB_REQUIRED')
  ) {
    return {
      ok: false,
      status: 403,
      code: 'BUSINESS_18_PLUS',
      messageNl: 'Een bedrijfsaccount kan pas vanaf 18 jaar.',
      messageEn: 'A business account is available from age 18.',
    };
  }

  return {
    ok: true,
    track: input.requested,
    unchanged: input.existingTrack === input.requested,
  };
}
