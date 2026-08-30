'use client';

import type { MissingRequirement } from '@/lib/account-requirements';
import { openAccountRequirementsGate } from '@/lib/onboarding/open-account-requirements-gate';

export type AccountRequirementsApiPayload = {
  missing: MissingRequirement[];
  action?: 'sendMessage' | 'postItem' | 'sell';
  hintKey?: string;
};

function parseAccountRequirementsBody(
  body: unknown
): AccountRequirementsApiPayload | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  if (o.error !== 'ACCOUNT_REQUIREMENTS_MISSING' || !Array.isArray(o.missing)) {
    return null;
  }
  return {
    missing: o.missing as MissingRequirement[],
    action:
      o.action === 'sendMessage' || o.action === 'postItem' || o.action === 'sell'
        ? o.action
        : undefined,
    hintKey: typeof o.hintKey === 'string' ? o.hintKey : undefined,
  };
}

/**
 * Detect ACCOUNT_REQUIREMENTS_MISSING and open the shared gate.
 *
 * Supports:
 * - `tryShowAccountRequirementsFromApiBody(status, body)` (preferred)
 * - `tryShowAccountRequirementsFromApiBody(body)` (legacy / defensive — still opens gate)
 */
export function tryShowAccountRequirementsFromApiBody(
  statusOrBody: number | unknown,
  body?: unknown
): boolean {
  let payload: AccountRequirementsApiPayload | null = null;

  if (typeof statusOrBody === 'number') {
    if (statusOrBody !== 403) return false;
    payload = parseAccountRequirementsBody(body);
  } else {
    // Defensive: MarketplaceOfferForm previously passed only the body.
    payload = parseAccountRequirementsBody(statusOrBody);
  }

  if (!payload) return false;

  openAccountRequirementsGate({
    missing: payload.missing,
    action: payload.action,
    hintKey: payload.hintKey,
  });
  return true;
}

export function parseAccountRequirementsFromApiBody(
  status: number,
  body: unknown
): AccountRequirementsApiPayload | null {
  if (status !== 403) return null;
  return parseAccountRequirementsBody(body);
}
