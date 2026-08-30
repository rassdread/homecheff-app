/**
 * U5 — ecosystem identity epoch (non-secret change detector).
 * Domain=.homecheff.eu so Growth/Studio receive it on every request.
 * Not an auth token — opaque UUID rotated on login / logout / account switch.
 * HttpOnly: products compare server-side; clients detect via session APIs.
 */

import { randomUUID } from "node:crypto";
import { getNextAuthSharedCookieDomain } from "@/lib/auth-cookie-domain";

export const HC_ECO_EPOCH_COOKIE = "hc_eco_epoch";

/** Logged-out sentinel so products can distinguish "no cookie yet" vs "logged out". */
export const HC_ECO_EPOCH_LOGGED_OUT = "0";

export function newEcosystemEpoch(): string {
  return randomUUID();
}

export function ecosystemEpochCookieOptions(maxAgeSec: number): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
  domain?: string;
} {
  const isProd = process.env.NODE_ENV === "production";
  const domain = getNextAuthSharedCookieDomain();
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
    ...(domain ? { domain } : {}),
  };
}

export function appendSetEcosystemEpochCookie(
  headers: Headers,
  epoch: string,
  maxAgeSec = 60 * 60 * 24 * 30,
): void {
  const opts = ecosystemEpochCookieOptions(maxAgeSec);
  const parts = [
    `${HC_ECO_EPOCH_COOKIE}=${encodeURIComponent(epoch)}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.maxAge}`,
    `SameSite=Lax`,
  ];
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.secure) parts.push("Secure");
  if (opts.httpOnly) parts.push("HttpOnly");
  headers.append("Set-Cookie", parts.join("; "));
}

export function appendClearEcosystemEpochCookie(headers: Headers): void {
  const isProd = process.env.NODE_ENV === "production";
  const shared = getNextAuthSharedCookieDomain();
  const domains = new Set<string | null>([null]);
  if (shared) domains.add(shared);
  if (isProd) {
    domains.add(".homecheff.eu");
    domains.add("homecheff.eu");
  }
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  for (const domain of domains) {
    const parts = [
      `${HC_ECO_EPOCH_COOKIE}=`,
      `Path=/`,
      `Expires=${expires}`,
      `Max-Age=0`,
      `SameSite=Lax`,
    ];
    if (domain) parts.push(`Domain=${domain}`);
    if (isProd) parts.push("Secure");
    parts.push("HttpOnly");
    headers.append("Set-Cookie", parts.join("; "));
  }
  // Also set logged-out sentinel briefly so concurrent tabs see change.
  appendSetEcosystemEpochCookie(headers, HC_ECO_EPOCH_LOGGED_OUT, 60);
}

export function readEcosystemEpochFromCookieHeader(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${HC_ECO_EPOCH_COOKIE}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1].trim()) || null;
  } catch {
    return match[1].trim() || null;
  }
}
