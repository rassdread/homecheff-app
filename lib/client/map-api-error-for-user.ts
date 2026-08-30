/**
 * Central mapping: never show internal SCREAMING_SNAKE API codes to end users.
 */

import type { MissingRequirement, MissingRequirementKey } from '@/lib/account-requirements';

/** Known internal error identifiers that must never surface as UI copy. */
export const INTERNAL_API_ERROR_CODES = new Set([
  'ACCOUNT_REQUIREMENTS_MISSING',
  'STRIPE_ACCOUNT_INCOMPLETE',
  'PROFILE_REQUIREMENTS_MISSING',
  'PAYMENTS_REQUIRED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INTERNAL_ERROR',
  'USER_NOT_FOUND',
]);

const LOOKS_LIKE_INTERNAL_CODE = /^[A-Z][A-Z0-9_]{2,}$/;

export function isInternalApiErrorCode(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (INTERNAL_API_ERROR_CODES.has(trimmed)) return true;
  return LOOKS_LIKE_INTERNAL_CODE.test(trimmed);
}

export type AccountRequirementUserCopyKeys = {
  titleKey: string;
  bodyKey: string;
  ctaKey: string;
  /** Navigate via Link when set; stripeOnboarding uses client onboard instead. */
  actionHref?: string;
  actionKind: 'link' | 'stripeOnboard' | 'emailVerify' | 'adjustPayment';
};

const REQUIREMENT_COPY: Record<MissingRequirementKey, AccountRequirementUserCopyKeys> = {
  emailVerified: {
    titleKey: 'accountRequirementsUx.emailVerified.title',
    bodyKey: 'accountRequirementsUx.emailVerified.body',
    ctaKey: 'accountRequirementsUx.emailVerified.cta',
    actionHref: '/verify-email',
    actionKind: 'emailVerify',
  },
  username: {
    titleKey: 'accountRequirementsUx.username.title',
    bodyKey: 'accountRequirementsUx.username.body',
    ctaKey: 'accountRequirementsUx.username.cta',
    actionHref: '/profile',
    actionKind: 'link',
  },
  termsAccepted: {
    titleKey: 'accountRequirementsUx.termsAccepted.title',
    bodyKey: 'accountRequirementsUx.termsAccepted.body',
    ctaKey: 'accountRequirementsUx.termsAccepted.cta',
    actionHref: '/profile',
    actionKind: 'link',
  },
  stripeOnboarding: {
    titleKey: 'accountRequirementsUx.stripeOnboarding.title',
    bodyKey: 'accountRequirementsUx.stripeOnboarding.body',
    ctaKey: 'accountRequirementsUx.stripeOnboarding.cta',
    actionKind: 'stripeOnboard',
  },
};

export function userCopyKeysForMissingRequirement(
  key: MissingRequirementKey
): AccountRequirementUserCopyKeys {
  return REQUIREMENT_COPY[key];
}

export function userCopyKeysForMissingRequirements(
  missing: MissingRequirement[]
): AccountRequirementUserCopyKeys | null {
  if (!missing.length) return null;
  const order: MissingRequirementKey[] = [
    'emailVerified',
    'termsAccepted',
    'username',
    'stripeOnboarding',
  ];
  for (const key of order) {
    if (missing.some((m) => m.key === key)) {
      return userCopyKeysForMissingRequirement(key);
    }
  }
  return userCopyKeysForMissingRequirement(missing[0].key);
}

/**
 * Resolve a displayable error string. Internal codes → fallback (never the code).
 */
export function sanitizeApiErrorForDisplay(
  raw: unknown,
  fallback: string
): string {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  if (isInternalApiErrorCode(raw)) return fallback;
  return raw.trim();
}

export function resolveListingSaveErrorMessage(params: {
  error?: unknown;
  errorKey?: unknown;
  detailsKey?: unknown;
  translate: (key: string) => string;
  fallbackKey: string;
}): string {
  const { error, errorKey, detailsKey, translate, fallbackKey } = params;
  if (typeof detailsKey === 'string' && detailsKey.trim()) {
    return translate(detailsKey);
  }
  if (typeof errorKey === 'string' && errorKey.trim()) {
    return translate(errorKey);
  }
  return sanitizeApiErrorForDisplay(error, translate(fallbackKey));
}
