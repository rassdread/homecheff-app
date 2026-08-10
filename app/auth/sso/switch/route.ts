/**
 * SP.2B.3 — GET /auth/sso/switch
 * Clear HomeCheff auth cookies for this browser, then open login for another account.
 * Does not touch Studio/Growth product sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { buildForceLogoutClearHeaders } from "@/lib/auth/force-logout-cookies";
import { isCentralSsoEnabled } from "@/lib/identity/sso/flags";
import { logSsoEvent } from "@/lib/identity/sso/metrics";
import { parseSsoInteraction, googlePromptForInteraction } from "@/lib/identity/sso/interaction";

export const dynamic = "force-dynamic";

function originFrom(req: Request): string {
  const env =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

/** Only allow relative /auth/sso/start?... return paths. */
function safeSsoStartReturn(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/auth/sso/start?")) return null;
  if (raw.includes("//") || raw.includes("\\") || raw.includes("@")) return null;
  try {
    const u = new URL(raw, "https://homecheff.local");
    if (u.pathname !== "/auth/sso/start") return null;
    if (!u.searchParams.get("product") || !u.searchParams.get("state")) return null;
    return `${u.pathname}${u.search}`;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!isCentralSsoEnabled()) {
    return NextResponse.json({ error: "Not Found", code: "SSO_DISABLED" }, { status: 404 });
  }

  const url = new URL(req.url);
  const returnPath = safeSsoStartReturn(url.searchParams.get("return"));
  if (!returnPath) {
    return NextResponse.json({ error: "Invalid request", code: "INVALID_REQUEST" }, { status: 400 });
  }

  const interaction = parseSsoInteraction(
    new URL(returnPath, "https://homecheff.local").searchParams.get("interaction") ??
      "select_account",
  );

  logSsoEvent("account_switch_requested", {
    interaction: interaction === "silent" ? "select_account" : interaction,
  });

  const login = new URL("/login", originFrom(req));
  login.searchParams.set("callbackUrl", returnPath);
  login.searchParams.set("ssoInteraction", interaction === "silent" ? "select_account" : interaction);
  const prompt = googlePromptForInteraction(
    interaction === "silent" ? "select_account" : interaction,
  );
  if (prompt) login.searchParams.set("prompt", prompt);

  const loginHint = new URL(returnPath, "https://homecheff.local").searchParams.get("login_hint");
  if (loginHint) login.searchParams.set("email", loginHint);

  const headers = buildForceLogoutClearHeaders(req, { includeCors: false });
  headers.set("Location", login.toString());
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return new NextResponse(null, { status: 303, headers });
}
