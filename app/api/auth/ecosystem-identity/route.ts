/**
 * U5 — lightweight ecosystem identity probe (no tokens / emails in body).
 * Used by products and Marketplace to ensure hc_eco_epoch exists when logged in.
 */

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/apiCors";
import {
  HC_ECO_EPOCH_LOGGED_OUT,
  appendSetEcosystemEpochCookie,
  newEcosystemEpoch,
  readEcosystemEpochFromCookieHeader,
} from "@/lib/ecosystem-session/epoch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hashId(id: string): string {
  return createHash("sha256").update(id).digest("hex").slice(0, 16);
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const session = await auth();
  const centralUserId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const epoch = readEcosystemEpochFromCookieHeader(req.headers.get("cookie"));

  const headers = new Headers(cors);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Content-Type", "application/json");

  if (!centralUserId) {
    return new NextResponse(
      JSON.stringify({
        authenticated: false,
        loggedOut: epoch === HC_ECO_EPOCH_LOGGED_OUT,
        code: epoch === HC_ECO_EPOCH_LOGGED_OUT ? "ECOSYSTEM_LOGGED_OUT" : "NO_SESSION",
      }),
      { status: 200, headers },
    );
  }

  let ecoEpoch = epoch;
  if (!ecoEpoch || ecoEpoch === HC_ECO_EPOCH_LOGGED_OUT) {
    ecoEpoch = newEcosystemEpoch();
    appendSetEcosystemEpochCookie(headers, ecoEpoch);
  }

  return new NextResponse(
    JSON.stringify({
      authenticated: true,
      identityHash: hashId(centralUserId),
      epochPresent: true,
      code: "OK",
    }),
    { status: 200, headers },
  );
}

export async function OPTIONS(req: NextRequest) {
  const cors = getCorsHeaders(req);
  return new NextResponse(null, { status: 204, headers: cors });
}
