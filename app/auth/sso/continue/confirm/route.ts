/**
 * SP.2B.3 — GET /auth/sso/continue/confirm
 * User confirmed "Continue as [current account]" → issue SSO code.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { issueSsoAuthorizationCode } from "@/lib/identity/sso/authorize";
import { SsoError } from "@/lib/identity/sso/constants";
import { isCentralSsoEnabled } from "@/lib/identity/sso/flags";
import { logSsoEvent } from "@/lib/identity/sso/metrics";
import { readSsoStartParams } from "@/lib/identity/sso/start-params";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isCentralSsoEnabled()) {
    return NextResponse.json({ error: "Not Found", code: "SSO_DISABLED" }, { status: 404 });
  }

  const url = new URL(req.url);
  let params;
  try {
    params = readSsoStartParams(url);
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INVALID_REQUEST";
    return NextResponse.json({ error: code, code }, { status: 400 });
  }

  const session = await auth();
  const centralUserId = (session?.user as { id?: string } | undefined)?.id;
  if (!centralUserId) {
    return NextResponse.json({ error: "UNAUTHORIZED", code: "UNAUTHORIZED" }, { status: 401 });
  }

  logSsoEvent(
    params.interaction === "claim" ? "claim_identity_confirmed" : "interactive_login",
    {
      product: params.product,
      interaction: params.interaction,
      phase: "confirmed",
    },
  );

  try {
    const { resolveAuthorizeEcoEpoch } = await import(
      "@/lib/identity/sso/authorize-epoch"
    );
    const { appendSetEcosystemEpochCookie } = await import(
      "@/lib/ecosystem-session/epoch"
    );
    const { ecoEpoch, shouldSetCookie } = resolveAuthorizeEcoEpoch(
      req.headers.get("cookie"),
    );
    const issued = await issueSsoAuthorizationCode({
      centralUserId,
      product: params.product,
      redirectUri: params.redirectUri,
      state: params.state,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      ecoEpoch,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      correlationId: req.headers.get("x-request-id") ?? undefined,
    });

    const dest = new URL(issued.redirectUri);
    dest.searchParams.set("code", issued.authorizationCode);
    dest.searchParams.set("state", issued.state);
    logSsoEvent("sso_success", { product: params.product, phase: "confirm_redirect" });
    const res = NextResponse.redirect(dest.toString(), 302);
    if (shouldSetCookie) {
      appendSetEcosystemEpochCookie(res.headers, ecoEpoch);
    }
    return res;
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INTERNAL_ERROR";
    const status = err instanceof SsoError ? err.httpStatus : 500;
    logSsoEvent("sso_failure", { product: params.product, code });
    return NextResponse.json({ error: code, code }, { status });
  }
}
