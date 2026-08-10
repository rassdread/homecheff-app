import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/apiCors";
import { buildForceLogoutClearHeaders } from "@/lib/auth/force-logout-cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Force-logout endpoint.
 *
 * Waarom dit naast /api/auth/signout bestaat:
 * Safari (vooral op iPhone/iPad in productie) blijft ingelogd na de standaard NextAuth signOut
 * wanneer het sessie-cookie ooit met andere attributen is gezet dan waarmee NextAuth het probeert
 * te wissen — bijv. host-only vs `Domain=.homecheff.eu`, of met/zonder `__Secure-` prefix na een
 * config-wijziging.
 */

export async function POST(req: NextRequest) {
  const headers = buildForceLogoutClearHeaders(req);
  headers.set("Content-Type", "application/json");
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers,
  });
}

export async function GET(req: NextRequest) {
  const headers = buildForceLogoutClearHeaders(req);
  headers.set("Location", "/");
  return new NextResponse(null, { status: 303, headers });
}

export async function OPTIONS(req: NextRequest) {
  const cors = getCorsHeaders(req);
  return new NextResponse(null, { status: 204, headers: cors });
}
