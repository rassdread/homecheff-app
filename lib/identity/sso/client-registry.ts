/**
 * Phase I.2 / SP.2B — product SSO client registry (server-only).
 * Do not accept arbitrary product/audience from callers without registry validation.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { SsoError, type SsoProduct } from "./constants";

export type SsoClientConfig = {
  product: SsoProduct;
  clientId: string;
  /** Exact redirect URIs — no wildcards. */
  allowedRedirectUris: string[];
  enabled: boolean;
};

function splitCsv(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function vercelEnv(): "development" | "preview" | "production" {
  const v = (process.env.VERCEL_ENV || process.env.NODE_ENV || "development").toLowerCase();
  if (v === "production") return "production";
  if (v === "preview") return "preview";
  return "development";
}

/** Default Growth callbacks per environment (overridable via GROWTH_SSO_REDIRECT_URI). */
export function defaultGrowthRedirectUris(): string[] {
  const env = vercelEnv();
  if (env === "production") {
    return ["https://growth.homecheff.eu/auth/sso/callback"];
  }
  if (env === "development") {
    return ["http://localhost:3000/auth/sso/callback"];
  }
  return [];
}

/** Default Studio callbacks per environment (overridable via STUDIO_SSO_REDIRECT_URI). */
export function defaultStudioRedirectUris(): string[] {
  const env = vercelEnv();
  if (env === "production") {
    return [
      "https://studio.homecheff.eu/auth/sso/callback",
      "https://motion.homecheff.eu/auth/sso/callback",
    ];
  }
  if (env === "development") {
    return ["http://localhost:3000/auth/sso/callback"];
  }
  return [];
}

export function resolveGrowthClient(): SsoClientConfig | null {
  const clientId = process.env.GROWTH_SSO_CLIENT_ID?.trim();
  if (!clientId) return null;

  const fromEnv = splitCsv(process.env.GROWTH_SSO_REDIRECT_URI);
  const allowedRedirectUris = fromEnv.length > 0 ? fromEnv : defaultGrowthRedirectUris();
  if (allowedRedirectUris.length === 0) return null;

  return {
    product: "growth",
    clientId,
    allowedRedirectUris,
    enabled: true,
  };
}

export function resolveStudioClient(): SsoClientConfig | null {
  const clientId = process.env.STUDIO_SSO_CLIENT_ID?.trim();
  if (!clientId) return null;

  const fromEnv = splitCsv(process.env.STUDIO_SSO_REDIRECT_URI);
  const allowedRedirectUris = fromEnv.length > 0 ? fromEnv : defaultStudioRedirectUris();
  if (allowedRedirectUris.length === 0) return null;

  return {
    product: "studio",
    clientId,
    allowedRedirectUris,
    enabled: true,
  };
}

export function getSsoClient(product: string): SsoClientConfig {
  if (product === "growth") {
    const client = resolveGrowthClient();
    if (!client || !client.enabled) {
      throw new SsoError("INVALID_REQUEST", "Product client not configured");
    }
    return client;
  }
  if (product === "studio") {
    const client = resolveStudioClient();
    if (!client || !client.enabled) {
      throw new SsoError("INVALID_REQUEST", "Product client not configured");
    }
    return client;
  }
  throw new SsoError("INVALID_REQUEST", "Unknown product");
}

function secretCandidatesFor(product: SsoProduct): string[] {
  if (product === "growth") {
    const primary = process.env.GROWTH_SSO_CLIENT_SECRET?.trim();
    const previous = process.env.GROWTH_SSO_CLIENT_SECRET_PREVIOUS?.trim();
    return [primary, previous].filter((s): s is string => Boolean(s));
  }
  const primary = process.env.STUDIO_SSO_CLIENT_SECRET?.trim();
  const previous = process.env.STUDIO_SSO_CLIENT_SECRET_PREVIOUS?.trim();
  return [primary, previous].filter((s): s is string => Boolean(s));
}

function safeEqualString(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

/**
 * Verify Authorization: Bearer &lt;product client secret&gt; (+ optional client id header).
 * Accepts previous secret briefly for rotation.
 */
export function authenticateSsoClient(input: {
  authorizationHeader: string | null;
  clientIdHeader: string | null;
  product: string;
}): SsoClientConfig {
  if (input.product !== "growth" && input.product !== "studio") {
    throw new SsoError("UNAUTHORIZED_CLIENT");
  }

  const client = getSsoClient(input.product);

  if (input.clientIdHeader && input.clientIdHeader !== client.clientId) {
    throw new SsoError("UNAUTHORIZED_CLIENT");
  }

  const auth = input.authorizationHeader ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    throw new SsoError("UNAUTHORIZED_CLIENT");
  }
  const presented = m[1]!.trim();
  const secrets = secretCandidatesFor(client.product);
  if (secrets.length === 0) {
    throw new SsoError("UNAUTHORIZED_CLIENT");
  }
  const ok = secrets.some((s) => safeEqualString(s, presented));
  if (!ok) {
    throw new SsoError("UNAUTHORIZED_CLIENT");
  }
  return client;
}

/** @deprecated Use authenticateSsoClient — kept for Growth call sites / tests. */
export function authenticateGrowthClient(input: {
  authorizationHeader: string | null;
  clientIdHeader: string | null;
  product: string;
}): SsoClientConfig {
  return authenticateSsoClient(input);
}

export function assertRedirectAllowed(client: SsoClientConfig, redirectUri: string): void {
  if (!client.allowedRedirectUris.includes(redirectUri)) {
    throw new SsoError("REDIRECT_MISMATCH");
  }
}
