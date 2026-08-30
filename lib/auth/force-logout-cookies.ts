/**
 * Clear NextAuth session cookies across host-only and shared Domain variants.
 * Used by /api/auth/force-logout and /auth/sso/switch (account selection).
 */

import type { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/apiCors";
import { getNextAuthSharedCookieDomain } from "@/lib/auth-cookie-domain";
import { appendClearEcosystemEpochCookie } from "@/lib/ecosystem-session/epoch";

const NEXT_AUTH_BASE_NAMES = [
  "next-auth.session-token",
  "next-auth.callback-url",
  "next-auth.csrf-token",
  "next-auth.pkce.code_verifier",
  "next-auth.state",
  "next-auth.session-token.0",
  "next-auth.session-token.1",
  "next-auth.session-token.2",
];

const SECURE_PREFIX_NAMES = NEXT_AUTH_BASE_NAMES.map((n) => `__Secure-${n}`);
const HOST_PREFIX_NAMES = [
  "__Host-next-auth.csrf-token",
  "__Host-next-auth.session-token",
];

const ALL_COOKIE_NAMES = [
  ...NEXT_AUTH_BASE_NAMES,
  ...SECURE_PREFIX_NAMES,
  ...HOST_PREFIX_NAMES,
];

export function buildForceLogoutClearHeaders(
  req: NextRequest,
  options?: { includeCors?: boolean },
): Headers {
  const isProd = process.env.NODE_ENV === "production";
  const headers = new Headers();

  if (options?.includeCors !== false) {
    const cors = getCorsHeaders(req);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  }

  const sharedDomain = getNextAuthSharedCookieDomain();
  const reqHost =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    "";

  const domainVariants = new Set<string | null>();
  domainVariants.add(null);
  if (sharedDomain) domainVariants.add(sharedDomain);
  if (isProd) {
    domainVariants.add(".homecheff.eu");
    domainVariants.add("homecheff.eu");
  }
  if (reqHost) domainVariants.add(reqHost);

  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";

  for (const name of ALL_COOKIE_NAMES) {
    for (const domain of domainVariants) {
      if (name.startsWith("__Host-") && domain !== null) continue;
      const needsSecure =
        isProd || name.startsWith("__Secure-") || name.startsWith("__Host-");

      const parts = [
        `${name}=`,
        `Path=/`,
        `Expires=${expires}`,
        `Max-Age=0`,
        `SameSite=Lax`,
      ];
      if (domain) parts.push(`Domain=${domain}`);
      if (needsSecure) parts.push("Secure");
      parts.push("HttpOnly");

      headers.append("Set-Cookie", parts.join("; "));
    }
  }

  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("Pragma", "no-cache");

  // U5/U6 — rotate ecosystem identity epoch so product sessions fail closed.
  appendClearEcosystemEpochCookie(headers);

  return headers;
}
