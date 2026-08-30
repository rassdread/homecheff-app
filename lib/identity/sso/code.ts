/**
 * Phase I.2 — authorization code + PKCE helpers.
 * Raw codes are never persisted; SHA-256(+optional pepper) hash-at-rest.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { SSO_CODE_MIN_ENTROPY_BITS, SSO_CODE_TTL_SECONDS, SsoError } from "./constants";

const CODE_BYTES = SSO_CODE_MIN_ENTROPY_BITS / 8; // 32

export function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateAuthorizationCode(): string {
  return base64UrlEncode(randomBytes(CODE_BYTES));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * U5 — prefix opaque ecoEpoch onto the authorization code so exchange can
 * return it without a schema migration. Format: `<uuid>.<high-entropy>`.
 */
export function generateAuthorizationCodeWithEpoch(ecoEpoch: string): string {
  if (!UUID_RE.test(ecoEpoch)) {
    throw new SsoError("INVALID_REQUEST", "Invalid ecoEpoch");
  }
  return `${ecoEpoch}.${generateAuthorizationCode()}`;
}

/** Extract ecoEpoch from a U5-prefixed code; null for legacy codes. */
export function parseEcoEpochFromAuthorizationCode(rawCode: string): string | null {
  const i = rawCode.indexOf(".");
  if (i !== 36) return null;
  const epoch = rawCode.slice(0, i);
  return UUID_RE.test(epoch) ? epoch : null;
}

function pepper(): string {
  return process.env.SSO_CODE_PEPPER?.trim() ?? "";
}

/** Deterministic lookup hash. High-entropy code → SHA-256 is sufficient (not a password hash). */
export function hashAuthorizationCode(rawCode: string): string {
  return createHash("sha256")
    .update(pepper())
    .update(":")
    .update(rawCode)
    .digest("hex");
}

export function codeExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + SSO_CODE_TTL_SECONDS * 1000);
}

export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  if (!codeVerifier || !codeChallenge) return false;
  if (codeVerifier.length < 43 || codeVerifier.length > 128) return false;
  const digest = createHash("sha256").update(codeVerifier).digest();
  const computed = base64UrlEncode(digest);
  try {
    const a = Buffer.from(computed);
    const b = Buffer.from(codeChallenge);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function requirePkceS256(codeVerifier: string, codeChallenge: string | null | undefined): void {
  if (!codeChallenge) {
    throw new SsoError("PKCE_FAILED");
  }
  if (!verifyPkceS256(codeVerifier, codeChallenge)) {
    throw new SsoError("PKCE_FAILED");
  }
}
