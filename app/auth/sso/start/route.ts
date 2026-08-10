/**
 * Phase I.3 / SP.2B.3 / SP.2B.5 — GET /auth/sso/start (browser)
 *
 * silent (+ session) → issue code → product callback
 * silent (no session) → redirect product callback with error=login_required (no HC login UI)
 * interactive (login|select_account|claim) + session → /auth/sso/continue
 * interactive (no session) → /login with callbackUrl back here
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { issueSsoAuthorizationCode } from "@/lib/identity/sso/authorize";
import { SsoError } from "@/lib/identity/sso/constants";
import { isCentralSsoEnabled } from "@/lib/identity/sso/flags";
import {
  googlePromptForInteraction,
  requiresInteractiveConfirmation,
} from "@/lib/identity/sso/interaction";
import { logSsoEvent } from "@/lib/identity/sso/metrics";
import {
  readSsoStartParams,
  ssoContinueRelativePath,
  ssoStartRelativePath,
} from "@/lib/identity/sso/start-params";

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
  let params;
  try {
    params = readSsoStartParams(url);
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INVALID_REQUEST";
    return NextResponse.json({ error: code, code }, { status: 400 });
  }

  logSsoEvent("sso_interaction_started", {
    product: params.product,
    interaction: params.interaction,
  });

  const session = await auth();
  const centralUserId = (session?.user as { id?: string } | undefined)?.id;

  if (!centralUserId) {
    // SP.2B.5 — silent must not open HC login UI (no loops / no account picker).
    if (params.interaction === "silent") {
      logSsoEvent("silent_sso_no_central_session", {
        product: params.product,
        interaction: params.interaction,
      });
      const dest = new URL(params.redirectUri);
      dest.searchParams.set("error", "login_required");
      dest.searchParams.set("state", params.state);
      return NextResponse.redirect(dest.toString(), 302);
    }

    const login = new URL("/login", originFrom(req));
    login.searchParams.set("callbackUrl", ssoStartRelativePath(params));
    login.searchParams.set("ssoInteraction", params.interaction);
    const prompt = googlePromptForInteraction(params.interaction);
    if (prompt) login.searchParams.set("prompt", prompt);
    if (params.loginHint) login.searchParams.set("email", params.loginHint);
    return NextResponse.redirect(login.toString(), 302);
  }

  if (requiresInteractiveConfirmation(params.interaction)) {
    logSsoEvent("interactive_login", {
      product: params.product,
      interaction: params.interaction,
      phase: "continue_required",
    });
    const continueUrl = new URL(ssoContinueRelativePath(params), originFrom(req));
    return NextResponse.redirect(continueUrl.toString(), 302);
  }

  logSsoEvent("silent_sso", {
    product: params.product,
    interaction: params.interaction,
  });

  try {
    const issued = await issueSsoAuthorizationCode({
      centralUserId,
      product: params.product,
      redirectUri: params.redirectUri,
      state: params.state,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      correlationId: req.headers.get("x-request-id") ?? undefined,
    });

    const dest = new URL(issued.redirectUri);
    dest.searchParams.set("code", issued.authorizationCode);
    dest.searchParams.set("state", issued.state);
    logSsoEvent("sso_success", { product: params.product, phase: "authorize_redirect" });
    return NextResponse.redirect(dest.toString(), 302);
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INTERNAL_ERROR";
    const status = err instanceof SsoError ? err.httpStatus : 500;
    logSsoEvent("sso_failure", { product: params.product, code });
    return NextResponse.json({ error: code, code }, { status });
  }
}
