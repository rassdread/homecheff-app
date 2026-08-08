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

    const result = await issueSsoAuthorizationCode({
      centralUserId,
      product,
      redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod,
      ip: clientIp(req),
      correlationId: correlationId(req),
    });

    return NextResponse.json({
      authorizationCode: result.authorizationCode,
      expiresIn: result.expiresIn,
      redirectUri: result.redirectUri,
      state: result.state,
    });
  } catch (err) {
    return ssoErrorResponse(err);
  }
}
