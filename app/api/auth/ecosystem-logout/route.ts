/**
 * U5/U6 — canonical ecosystem logout (clears IdP session + rotates epoch).
 * Alias of force-logout with explicit ecosystem semantics for product clients.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/apiCors";
import { buildForceLogoutClearHeaders } from "@/lib/auth/force-logout-cookies";
import { logSsoEvent } from "@/lib/identity/sso/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  logSsoEvent("ecosystem_logout", { product: "marketplace" });
  const headers = buildForceLogoutClearHeaders(req);
  headers.set("Content-Type", "application/json");
  return new NextResponse(
    JSON.stringify({ ok: true, code: "ECOSYSTEM_LOGGED_OUT" }),
    { status: 200, headers },
  );
}

export async function GET(req: NextRequest) {
  logSsoEvent("ecosystem_logout", { product: "marketplace", via: "get" });
  const headers = buildForceLogoutClearHeaders(req);
  const returnTo = req.nextUrl.searchParams.get("returnTo");
  const safe =
    returnTo &&
    (returnTo.startsWith("https://growth.homecheff.eu/") ||
      returnTo.startsWith("https://studio.homecheff.eu/") ||
      returnTo.startsWith("https://motion.homecheff.eu/") ||
      returnTo.startsWith("https://homecheff.eu/") ||
      returnTo.startsWith("https://www.homecheff.eu/") ||
      returnTo.startsWith("/"));
  headers.set("Location", safe ? returnTo! : "/");
  return new NextResponse(null, { status: 303, headers });
}

export async function OPTIONS(req: NextRequest) {
  const cors = getCorsHeaders(req);
  return new NextResponse(null, { status: 204, headers: cors });
}
