/**
 * LEGAL-4A — Business.verified helpers.
 * Only factual verification may set verified=true — never from KvK/VAT/Stripe/declaration alone.
 */

export type BusinessVerifyDecisionInput = {
  /** Explicit admin attestation that verification was performed. */
  adminAttested: boolean;
  note?: string | null;
};

export function canSetBusinessVerified(
  input: BusinessVerifyDecisionInput,
): { ok: true } | { ok: false; reason: string } {
  if (!input.adminAttested) {
    return {
      ok: false,
      reason: 'Admin attestation required — no auto-verify from KvK/VAT/Stripe/declaration',
    };
  }
  if (!input.note?.trim() || input.note.trim().length < 8) {
    return {
      ok: false,
      reason: 'Verification note required (what was checked)',
    };
  }
  return { ok: true };
}

/** Signals that must NEVER alone flip Business.verified. */
export const BUSINESS_VERIFIED_FORBIDDEN_AUTO_SIGNALS = [
  'KVK_PRESENT',
  'VAT_PRESENT',
  'STRIPE_CONNECT_PRESENT',
  'SELF_DECLARED_PROFESSIONAL',
] as const;
