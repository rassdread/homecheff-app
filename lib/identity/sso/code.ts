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
