/**
 * Phase I.2 — POST /api/identity/v1/sso/exchange
 * Server-to-server only. Gated by CENTRAL_SSO_ENABLED.
 */

import { NextResponse } from "next/server";
import { exchangeSsoAuthorizationCode } from "@/lib/identity/sso/exchange";
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
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      throw new SsoError("INVALID_REQUEST");
    }

    const code = String(body.code ?? "");
    const product = String(body.product ?? "");
    const redirectUri = String(body.redirectUri ?? body.redirect_uri ?? "");
    const codeVerifier = String(body.codeVerifier ?? body.code_verifier ?? "");

    if (!code || !product || !redirectUri || !codeVerifier) {
      throw new SsoError("INVALID_REQUEST");
    }

    const claims = await exchangeSsoAuthorizationCode({
      code,
      product,
      redirectUri,
      codeVerifier,
      authorizationHeader: req.headers.get("authorization"),
      clientIdHeader: req.headers.get("x-sso-client-id"),
      ip: clientIp(req),
      correlationId: correlationId(req),
    });

    return NextResponse.json(claims);
  } catch (err) {
    return ssoErrorResponse(err);
  }
}
