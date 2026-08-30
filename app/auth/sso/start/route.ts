/**
 * Phase I.3 / SP.2B.3 / SP.2B.5 / SP.2D-C6 — GET /auth/sso/start (browser)
 *
 * silent (+ session) → issue code → product callback
 * silent (no session) → redirect product callback with error=login_required (no HC login UI)
 * interactive (login|select_account|claim) + session → /auth/sso/continue
 * interactive (no session) → /login with callbackUrl back here
 *
 * SP.2D-C6: identity via JWT getToken (no session-callback marketplace hydrate);
 * Server-Timing durations only.
 */

import { NextResponse } from "next/server";
import { SsoError } from "@/lib/identity/sso/constants";
import { isCentralSsoEnabled } from "@/lib/identity/sso/flags";
import {
  googlePromptForInteraction,
  requiresInteractiveConfirmation,
} from "@/lib/identity/sso/interaction";
import { logSsoEvent } from "@/lib/identity/sso/metrics";
import { resolveCentralUserIdFromRequest } from "@/lib/identity/sso/resolve-central-user-id";
import {
  applySsoStartServerTiming,
  SsoStartTimer,
} from "@/lib/identity/sso/start-timing";
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

function withTiming(res: NextResponse, timer: SsoStartTimer): NextResponse {
  applySsoStartServerTiming(res, timer);
  return res;
}

export async function GET(req: Request) {
  const timer = new SsoStartTimer();

  if (!isCentralSsoEnabled()) {
    return NextResponse.json({ error: "Not Found", code: "SSO_DISABLED" }, { status: 404 });
  }

  const url = new URL(req.url);
  let params;
  try {
    params = readSsoStartParams(url);
    timer.mark("parse");
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INVALID_REQUEST";
    return NextResponse.json({ error: code, code }, { status: 400 });
  }

  logSsoEvent("sso_interaction_started", {
    product: params.product,
    interaction: params.interaction,
  });

  // SP.2D-C6 — JWT id only; skip getServerSession marketplace hydrate.
  const centralUserId = await resolveCentralUserIdFromRequest(req);
  timer.mark("session");

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
      return withTiming(NextResponse.redirect(dest.toString(), 302), timer);
    }

    const login = new URL("/login", originFrom(req));
    login.searchParams.set("callbackUrl", ssoStartRelativePath(params));
    login.searchParams.set("ssoInteraction", params.interaction);
    const prompt = googlePromptForInteraction(params.interaction);
    if (prompt) login.searchParams.set("prompt", prompt);
    if (params.loginHint) login.searchParams.set("email", params.loginHint);
    if (params.intent) login.searchParams.set("intent", params.intent);
    // One provider choice: Growth/Studio Google CTA → auto-start Google on IdP.
    if (params.intent === "google") {
      login.searchParams.set("autoGoogle", "1");
    }
    return withTiming(NextResponse.redirect(login.toString(), 302), timer);
  }

  if (requiresInteractiveConfirmation(params.interaction)) {
    // Provider intent already chosen on the product (Google / email-password).
    // After IdP auth succeeds, do NOT show a second "Continue as…" step —
    // that broke ONE_LOGIN (Growth → IdP login → continue → Growth).
    const providerIntentFulfilled =
      params.intent === "password" || params.intent === "google";
    if (!providerIntentFulfilled) {
      logSsoEvent("interactive_login", {
        product: params.product,
        interaction: params.interaction,
        phase: "continue_required",
      });
      const continueUrl = new URL(ssoContinueRelativePath(params), originFrom(req));
      return withTiming(NextResponse.redirect(continueUrl.toString(), 302), timer);
    }
    logSsoEvent("interactive_login", {
      product: params.product,
      interaction: params.interaction,
      phase: "intent_auto_continue",
      intent: params.intent,
    });
  }

  logSsoEvent("silent_sso", {
    product: params.product,
    interaction: params.interaction,
  });

  try {
    // SP.2D-C7 — load Prisma/authorize only when issuing a code (not on login_required / continue).
    const { issueSsoAuthorizationCode } = await import("@/lib/identity/sso/authorize");
    const { resolveAuthorizeEcoEpoch } = await import("@/lib/identity/sso/authorize-epoch");
    const { appendSetEcosystemEpochCookie } = await import(
      "@/lib/ecosystem-session/epoch"
    );
    // Must reuse browser hc_eco_epoch — minting a new one here causes product
    // session/cookie epoch mismatch → Growth/Studio redirect loops.
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

    if (issued.timing) {
      timer.setDuration("user", issued.timing.user);
      timer.setDuration("code", issued.timing.code);
      timer.setDuration("persist", issued.timing.persist);
    }

    const dest = new URL(issued.redirectUri);
    dest.searchParams.set("code", issued.authorizationCode);
    dest.searchParams.set("state", issued.state);
    logSsoEvent("sso_success", { product: params.product, phase: "authorize_redirect" });
    const res = withTiming(NextResponse.redirect(dest.toString(), 302), timer);
    if (shouldSetCookie) {
      appendSetEcosystemEpochCookie(res.headers, ecoEpoch);
    }
    return res;
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INTERNAL_ERROR";
    const status = err instanceof SsoError ? err.httpStatus : 500;
    logSsoEvent("sso_failure", { product: params.product, code });
    return withTiming(
      NextResponse.json({ error: code, code }, { status }),
      timer,
    );
  }
}
