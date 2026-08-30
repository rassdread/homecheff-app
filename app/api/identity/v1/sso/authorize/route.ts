/**
 * Phase I.2 — POST /api/identity/v1/sso/authorize
 * Requires HomeCheff authenticated session. Gated by CENTRAL_SSO_ENABLED.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { issueSsoAuthorizationCode } from "@/lib/identity/sso/authorize";
import { SsoError } from "@/lib/identity/sso/constants";
import {
  clientIp,
  correlationId,
  requireSsoEnabled,
  ssoErrorResponse,
} from "@/lib/identity/sso/http";
import {
  HC_ECO_EPOCH_COOKIE,
  HC_ECO_EPOCH_LOGGED_OUT,
  appendSetEcosystemEpochCookie,
  newEcosystemEpoch,
  readEcosystemEpochFromCookieHeader,
} from "@/lib/ecosystem-session/epoch";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const disabled = requireSsoEnabled();
  if (disabled) return disabled;

  try {
    const session = await auth();
    const centralUserId = (session?.user as { id?: string } | undefined)?.id;
    if (!centralUserId) {
      throw new SsoError("UNAUTHORIZED");
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      throw new SsoError("INVALID_REQUEST");
    }

    const product = String(body.product ?? "");
    const redirectUri = String(body.redirectUri ?? body.redirect_uri ?? "");
    const state = String(body.state ?? "");
    const codeChallenge = String(body.codeChallenge ?? body.code_challenge ?? "");
    const codeChallengeMethod = String(
      body.codeChallengeMethod ?? body.code_challenge_method ?? "",
    );

    if (!product || !redirectUri || !state || !codeChallenge || !codeChallengeMethod) {
      throw new SsoError("INVALID_REQUEST");
    }

    const existingEpoch = readEcosystemEpochFromCookieHeader(
      req.headers.get("cookie"),
    );
    const ecoEpoch =
      existingEpoch && existingEpoch !== HC_ECO_EPOCH_LOGGED_OUT
        ? existingEpoch
        : newEcosystemEpoch();

    const result = await issueSsoAuthorizationCode({
      centralUserId,
      product,
      redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod,
      ecoEpoch,
      ip: clientIp(req),
      correlationId: correlationId(req),
    });

    const res = NextResponse.json({
      authorizationCode: result.authorizationCode,
      expiresIn: result.expiresIn,
      redirectUri: result.redirectUri,
      state: result.state,
    });
    // Ensure parent-domain epoch cookie is present for product hosts.
    if (!existingEpoch || existingEpoch === HC_ECO_EPOCH_LOGGED_OUT) {
      appendSetEcosystemEpochCookie(res.headers, ecoEpoch);
    } else if (!req.headers.get("cookie")?.includes(`${HC_ECO_EPOCH_COOKIE}=`)) {
      appendSetEcosystemEpochCookie(res.headers, ecoEpoch);
    }
    return res;
  } catch (err) {
    return ssoErrorResponse(err);
  }
}
