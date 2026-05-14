'use client';

import type { MissingRequirement } from '@/lib/account-requirements';
import { openAccountRequirementsGate } from '@/lib/onboarding/open-account-requirements-gate';

export function tryShowAccountRequirementsFromApiBody(
  status: number,
  body: unknown
): boolean {
  if (status !== 403 || !body || typeof body !== 'object') return false;
  const o = body as Record<string, unknown>;
  if (o.error !== 'ACCOUNT_REQUIREMENTS_MISSING' || !Array.isArray(o.missing)) {
    return false;
  }
  openAccountRequirementsGate({
    missing: o.missing as MissingRequirement[],
    action:
      o.action === 'sendMessage' || o.action === 'postItem' || o.action === 'sell'
        ? o.action
        : undefined,
    hintKey: typeof o.hintKey === 'string' ? o.hintKey : undefined,
  });
  return true;
}
