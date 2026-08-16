/**
 * Phase I.2 / SP.2D-C6 — authorize core (HomeCheff session → one-time code).
 * Does not call Growth DB.
 */

import { prisma } from "@/lib/prisma";
import {
  assertAccountActiveForSso,
  loadCentralUserForAuthorizeOrThrow,
} from "./account-status";
import { writeSsoAudit } from "./audit";
import { assertRedirectAllowed, getSsoClient } from "./client-registry";
import {
  codeExpiresAt,
  generateAuthorizationCode,
  hashAuthorizationCode,
} from "./code";
import { SSO_CODE_TTL_SECONDS, SsoError } from "./constants";
import { logSsoEvent, ssoMetrics } from "./metrics";
import { assertAuthorizeRateLimit } from "./rate-limit";

export type AuthorizeInput = {
  centralUserId: string;
  product: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  ip?: string;
  correlationId?: string;
};

export type AuthorizeResult = {
  authorizationCode: string;
  expiresIn: number;
  redirectUri: string;
  state: string;
  /** Duration marks for Server-Timing (ms); no secrets. */
  timing?: { user: number; code: number; persist: number };
};

function validateState(state: string): void {
  if (!state || typeof state !== "string" || state.length < 8 || state.length > 512) {
    throw new SsoError("INVALID_REQUEST", "Invalid state");
  }
}

function validateChallenge(challenge: string, method: string): void {
  if (method !== "S256") {
    throw new SsoError("PKCE_FAILED");
  }
  // base64url S256 challenge is typically 43 chars
  if (!challenge || challenge.length < 43 || challenge.length > 128) {
    throw new SsoError("PKCE_FAILED");
  }
  if (!/^[A-Za-z0-9\-_]+$/.test(challenge)) {
    throw new SsoError("PKCE_FAILED");
  }
}

export async function issueSsoAuthorizationCode(
  input: AuthorizeInput,
): Promise<AuthorizeResult> {
  ssoMetrics.authorizeTotal();
  try {
    assertAuthorizeRateLimit(input.ip ?? "unknown", input.centralUserId);

    validateState(input.state);
    validateChallenge(input.codeChallenge, input.codeChallengeMethod);

    const client = getSsoClient(input.product);
    assertRedirectAllowed(client, input.redirectUri);

    const tUser0 = performance.now();
    const user = await loadCentralUserForAuthorizeOrThrow(input.centralUserId);
    assertAccountActiveForSso(user);
    const userMs = Math.round(performance.now() - tUser0);

    const tCode0 = performance.now();
    const rawCode = generateAuthorizationCode();
    const codeHash = hashAuthorizationCode(rawCode);
    const expiresAt = codeExpiresAt();
    const codeMs = Math.round(performance.now() - tCode0);

    // Lazy cleanup of expired unused codes (best-effort; never blocks issue)
    void prisma.ssoAuthorizationCode
      .deleteMany({
        where: {
          usedAt: null,
          expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })
      .catch(() => undefined);

    const tPersist0 = performance.now();
    const row = await prisma.ssoAuthorizationCode.create({
      data: {
        codeHash,
        centralUserId: user.id,
        product: client.product,
        redirectUri: input.redirectUri,
        codeChallenge: input.codeChallenge,
        codeChallengeMethod: "S256",
        state: input.state,
        expiresAt,
        usedAt: null,
      },
    });
    const persistMs = Math.round(performance.now() - tPersist0);

    // Audit must not delay the redirect (still written; failures logged).
    void writeSsoAudit({
      action: "SSO_CODE_ISSUED",
      product: client.product,
      centralUserId: user.id,
      codeId: row.id,
      metadata: {
        correlationId: input.correlationId ?? null,
        redirectHost: safeHost(input.redirectUri),
      },
    });

    logSsoEvent("sso_authorize_ok", {
      product: client.product,
      codeIdPrefix: row.id.slice(0, 8),
      correlationId: input.correlationId ?? null,
    });

    return {
      authorizationCode: rawCode,
      expiresIn: SSO_CODE_TTL_SECONDS,
      redirectUri: input.redirectUri,
      state: input.state,
      timing: { user: userMs, code: codeMs, persist: persistMs },
    };
  } catch (err) {
    ssoMetrics.authorizeFailed();
    const code = err instanceof SsoError ? err.code : "INTERNAL_ERROR";
    await writeSsoAudit({
      action: "SSO_CODE_ISSUE_FAILED",
      product: typeof input.product === "string" ? input.product : null,
      centralUserId: input.centralUserId,
      metadata: {
        reason: code,
        correlationId: input.correlationId ?? null,
      },
    });
    throw err;
  }
}

function safeHost(uri: string): string | null {
  try {
    return new URL(uri).host;
  } catch {
    return null;
  }
}
