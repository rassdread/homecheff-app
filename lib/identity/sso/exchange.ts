/**
 * Phase I.2 — exchange core (server-to-server).
 * Atomic single-use: UPDATE ... WHERE usedAt IS NULL AND expiresAt > now.
 */

import { prisma } from "@/lib/prisma";
import {
  assertAccountActiveForSso,
  loadCentralUserOrThrow,
  toMinimalClaims,
} from "./account-status";
import { writeSsoAudit } from "./audit";
import {
  assertRedirectAllowed,
  authenticateSsoClient,
  type SsoClientConfig,
} from "./client-registry";
import { hashAuthorizationCode, requirePkceS256 } from "./code";
import { SsoError } from "./constants";
import { logSsoEvent, ssoMetrics } from "./metrics";
import {
  assertExchangeRateLimit,
  assertFailedExchangeRateLimit,
} from "./rate-limit";

export type ExchangeInput = {
  code: string;
  product: string;
  redirectUri: string;
  codeVerifier: string;
  authorizationHeader: string | null;
  clientIdHeader: string | null;
  ip?: string;
  correlationId?: string;
};

export async function exchangeSsoAuthorizationCode(input: ExchangeInput) {
  const started = Date.now();
  ssoMetrics.exchangeTotal();

  let client: SsoClientConfig | null = null;
  try {
    try {
      client = authenticateSsoClient({
        authorizationHeader: input.authorizationHeader,
        clientIdHeader: input.clientIdHeader,
        product: input.product,
      });
    } catch (err) {
      ssoMetrics.clientRejected();
      await writeSsoAudit({
        action: "SSO_CLIENT_REJECTED",
        product: input.product,
        metadata: { correlationId: input.correlationId ?? null },
      });
      throw err;
    }

    assertExchangeRateLimit(input.ip ?? "unknown", client.clientId);

    if (!input.code || typeof input.code !== "string") {
      throw new SsoError("INVALID_REQUEST");
    }
    if (!input.codeVerifier || typeof input.codeVerifier !== "string") {
      throw new SsoError("PKCE_FAILED");
    }

    assertRedirectAllowed(client, input.redirectUri);

    if (input.product !== client.product) {
      throw new SsoError("AUDIENCE_MISMATCH");
    }

    const codeHash = hashAuthorizationCode(input.code);

    // Load row for PKCE / binding checks BEFORE consume (do not mark used yet)
    const existing = await prisma.ssoAuthorizationCode.findUnique({
      where: { codeHash },
    });

    if (!existing) {
      throw new SsoError("INVALID_CODE");
    }

    if (existing.product !== client.product) {
      throw new SsoError("AUDIENCE_MISMATCH");
    }

    if (existing.redirectUri !== input.redirectUri) {
      throw new SsoError("REDIRECT_MISMATCH");
    }

    if (existing.usedAt) {
      ssoMetrics.replayRejected();
      await writeSsoAudit({
        action: "SSO_REPLAY_REJECTED",
        product: client.product,
        centralUserId: existing.centralUserId,
        codeId: existing.id,
        metadata: { correlationId: input.correlationId ?? null },
      });
      throw new SsoError("USED_CODE");
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new SsoError("EXPIRED_CODE");
    }

    requirePkceS256(input.codeVerifier, existing.codeChallenge);

    // Re-check account before consume
    const user = await loadCentralUserOrThrow(existing.centralUserId);
    assertAccountActiveForSso(user);

    // Atomic single-use consume
    const now = new Date();
    const consumed = await prisma.ssoAuthorizationCode.updateMany({
      where: {
        id: existing.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (consumed.count !== 1) {
      // Lost race or expired between checks
      const again = await prisma.ssoAuthorizationCode.findUnique({
        where: { id: existing.id },
      });
      if (again?.usedAt) {
        ssoMetrics.replayRejected();
        await writeSsoAudit({
          action: "SSO_REPLAY_REJECTED",
          product: client.product,
          centralUserId: existing.centralUserId,
          codeId: existing.id,
          metadata: {
            correlationId: input.correlationId ?? null,
            concurrent: true,
          },
        });
        throw new SsoError("USED_CODE");
      }
      if (again && again.expiresAt.getTime() <= Date.now()) {
        throw new SsoError("EXPIRED_CODE");
      }
      throw new SsoError("INVALID_CODE");
    }

    const claims = toMinimalClaims(user, client.product);

    await writeSsoAudit({
      action: "SSO_EXCHANGE_SUCCESS",
      product: client.product,
      centralUserId: user.id,
      codeId: existing.id,
      metadata: { correlationId: input.correlationId ?? null },
    });

    ssoMetrics.exchangeSuccess();
    ssoMetrics.exchangeLatency(Date.now() - started);
    logSsoEvent("sso_exchange_ok", {
      product: client.product,
      codeIdPrefix: existing.id.slice(0, 8),
      latencyMs: Date.now() - started,
    });

    return claims;
  } catch (err) {
    ssoMetrics.exchangeFailed();
    ssoMetrics.exchangeLatency(Date.now() - started);
    const reason = err instanceof SsoError ? err.code : "INTERNAL_ERROR";
    if (reason !== "UNAUTHORIZED_CLIENT" && reason !== "USED_CODE") {
      await writeSsoAudit({
        action: "SSO_EXCHANGE_FAILED",
        product: input.product,
        metadata: {
          reason,
          correlationId: input.correlationId ?? null,
        },
      });
    }
    // Count failed attempts without masking the original error
    if (reason !== "RATE_LIMITED") {
      try {
        assertFailedExchangeRateLimit(input.ip ?? "unknown");
      } catch {
        /* ignore — keep original err */
      }
    }
    throw err;
  }
}
