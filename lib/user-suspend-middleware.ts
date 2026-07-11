/**
 * Phase 13T — Suspension mutation guard SSOT.
 *
 * Central rules for which API mutations remain available to suspended accounts.
 * Read access (GET/HEAD/OPTIONS) is always allowed so users can view suspension
 * notices, support/appeal information, and download their GDPR export.
 */

import { NextResponse } from 'next/server';

export const SUSPENSION_BLOCK_MESSAGE =
  'Je account is tijdelijk geschorst. Je kunt geen acties uitvoeren op het platform. Neem contact op met support als je denkt dat dit een vergissing is.';

/** HTTP methods treated as platform mutations when user is suspended. */
export const SUSPENSION_MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * API path prefixes that stay mutable while suspended.
 * Intentionally minimal — GDPR export uses GET and is not listed here.
 */
export const SUSPENSION_MUTATION_ALLOWLIST: Array<{ method?: string; pathPrefix: string; reason: string }> = [
  {
    pathPrefix: '/api/auth/signout',
    reason: 'User must be able to end session after reading suspension notice.',
  },
  {
    pathPrefix: '/api/auth/session',
    reason: 'Session refresh/read for authenticated suspension UI.',
  },
  {
    pathPrefix: '/api/auth/csrf',
    reason: 'CSRF token required for sign-out flow.',
  },
];

/** Paths that never require suspension checks (public / system). */
export const SUSPENSION_GUARD_EXEMPT_PREFIXES = [
  '/api/auth/callback',
  '/api/auth/signin',
  '/api/internal/',
  '/api/webhooks',
  '/api/stripe/webhook',
  '/api/cron',
  '/api/health',
  '/api/inbound',
];

export function isSuspensionGuardExemptPath(pathname: string): boolean {
  return SUSPENSION_GUARD_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isSuspensionMutationAllowlisted(pathname: string, method: string): boolean {
  return SUSPENSION_MUTATION_ALLOWLIST.some((entry) => {
    if (entry.method && entry.method !== method) return false;
    return pathname === entry.pathPrefix || pathname.startsWith(`${entry.pathPrefix}/`);
  });
}

export function shouldBlockSuspendedMutation(pathname: string, method: string): boolean {
  if (!pathname.startsWith('/api/')) return false;
  if (!SUSPENSION_MUTATION_METHODS.has(method)) return false;
  if (isSuspensionGuardExemptPath(pathname)) return false;
  if (isSuspensionMutationAllowlisted(pathname, method)) return false;
  return true;
}

export function suspensionMutationBlockedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: SUSPENSION_BLOCK_MESSAGE,
      code: 'ACCOUNT_SUSPENDED',
    },
    { status: 403 },
  );
}

/**
 * Public listings while suspended: existing listings remain publicly visible;
 * suspended users cannot create, edit, or reactivate listings until restored.
 * Admin restore clears suspendedAt and re-enables mutations immediately.
 */
