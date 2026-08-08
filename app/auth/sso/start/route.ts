/**
 * Phase I.3 — GET /auth/sso/start (browser)
 * If HomeCheff session exists → issue code → redirect to Growth callback.
 * If not → redirect to login with callbackUrl back here.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { issueSsoAuthorizationCode } from "@/lib/identity/sso/authorize";
import { SsoError } from "@/lib/identity/sso/constants";
import { isCentralSsoEnabled } from "@/lib/identity/sso/flags";
import { getSsoClient, assertRedirectAllowed } from "@/lib/identity/sso/client-registry";

export const dynamic = "force-dynamic";

function originFrom(req: Request): string {
  const env =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  if (!isCentralSsoEnabled()) {
    return NextResponse.json({ error: "Not Found", code: "SSO_DISABLED" }, { status: 404 });
  }

  const url = new URL(req.url);
  const product = url.searchParams.get("product") ?? "";
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const codeChallenge = url.searchParams.get("code_challenge") ?? "";
  const codeChallengeMethod = url.searchParams.get("code_challenge_method") ?? "";

  if (!product || !redirectUri || !state || !codeChallenge || codeChallengeMethod !== "S256") {
    return NextResponse.json({ error: "Invalid request", code: "INVALID_REQUEST" }, { status: 400 });
  }

  try {
    const client = getSsoClient(product);
    assertRedirectAllowed(client, redirectUri);
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INVALID_REQUEST";
    return NextResponse.json({ error: code, code }, { status: 400 });
  }

  const session = await auth();
  const centralUserId = (session?.user as { id?: string } | undefined)?.id;
  if (!centralUserId) {
    const login = new URL("/login", originFrom(req));
    login.searchParams.set("callbackUrl", url.pathname + url.search);
    return NextResponse.redirect(login.toString(), 302);
  }

  try {
    const issued = await issueSsoAuthorizationCode({
      centralUserId,
      product,
      redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      correlationId: req.headers.get("x-request-id") ?? undefined,
    });

    const dest = new URL(issued.redirectUri);
    dest.searchParams.set("code", issued.authorizationCode);
    dest.searchParams.set("state", issued.state);
    return NextResponse.redirect(dest.toString(), 302);
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INTERNAL_ERROR";
    const status = err instanceof SsoError ? err.httpStatus : 500;
    return NextResponse.json({ error: code, code }, { status });
  }
}
