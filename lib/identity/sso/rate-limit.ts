/**
 * Phase I.2 — in-memory SSO rate limits (serverless best-effort).
 */

import { SsoError } from "./constants";

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const WINDOWS_MS = 60_000;

const LIMITS = {
  authorizeIp: 30,
  authorizeUser: 10,
  exchangeIp: 20,
  exchangeClient: 60,
  exchangeFailIp: 15,
} as const;

function take(key: string, limit: number): void {
  const now = Date.now();
  const b = store.get(key);
  if (!b || now > b.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOWS_MS });
    return;
  }
  if (b.count >= limit) {
    throw new SsoError("RATE_LIMITED");
  }
  b.count += 1;
}

export function assertAuthorizeRateLimit(ip: string, centralUserId: string): void {
  take(`sso:auth:ip:${ip || "unknown"}`, LIMITS.authorizeIp);
  take(`sso:auth:user:${centralUserId}`, LIMITS.authorizeUser);
}

export function assertExchangeRateLimit(ip: string, clientId: string): void {
  take(`sso:ex:ip:${ip || "unknown"}`, LIMITS.exchangeIp);
  take(`sso:ex:client:${clientId}`, LIMITS.exchangeClient);
}

export function assertFailedExchangeRateLimit(ip: string): void {
  take(`sso:exfail:ip:${ip || "unknown"}`, LIMITS.exchangeFailIp);
}

/** Test-only reset. */
export function __resetSsoRateLimitsForTests(): void {
  store.clear();
}

export const SSO_RATE_LIMITS = LIMITS;
