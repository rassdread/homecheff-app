import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

function growthBase() {
  return (
    process.env.GROWTH_HC_QUOTE_BASE_URL ??
    process.env.GROWTH_API_BASE_URL ??
    "https://growth.homecheff.eu"
  ).replace(/\/$/, "");
}

function growthSecret() {
  return (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET?.trim() ||
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET?.trim() ||
    process.env.STUDIO_HC_INTERNAL_SECRET?.trim() ||
    process.env.HC_INTERNAL_PROBE_SECRET?.trim() ||
    ""
  );
}

/**
 * Marketplace proxy → Growth affiliate organization APIs.
 * Uses the caller's session cookie forwarded when possible; falls back to internal create with centralUserId.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, code: "USER_NOT_FOUND" }, { status: 404, headers: NO_STORE });
  }

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  const analytics = url.searchParams.get("analytics") === "1";
  const qs = new URLSearchParams();
  if (organizationId) qs.set("organizationId", organizationId);
  if (analytics) qs.set("analytics", "1");
  if (!organizationId) qs.set("centralUserId", user.id);

  const secret = growthSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, degraded: true, code: "GROWTH_SECRET_MISSING" },
      { status: 200, headers: NO_STORE },
    );
  }

  const res = await fetch(
    `${growthBase()}/api/internal/ecosystem/affiliate/organization?${qs.toString()}`,
    {
      headers: {
        "x-hc-ecosystem-internal-secret": secret,
        "x-studio-hc-internal-secret": secret,
        "x-central-user-id": user.id,
      },
      cache: "no-store",
    },
  );
  const json = await res.json().catch(() => ({ ok: false, code: "GROWTH_ERROR" }));
  return NextResponse.json(json, { status: res.status, headers: NO_STORE });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, code: "USER_NOT_FOUND" }, { status: 404, headers: NO_STORE });
  }

  const secret = growthSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, code: "GROWTH_SECRET_MISSING" }, { status: 503, headers: NO_STORE });
  }

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${growthBase()}/api/internal/ecosystem/affiliate/organization`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hc-ecosystem-internal-secret": secret,
      "x-studio-hc-internal-secret": secret,
      "x-central-user-id": user.id,
    },
    body: JSON.stringify({
      ...body,
      actorUserId: user.id,
      actorEmail: user.email,
      economicCentralUserId: user.id,
    }),
  });
  const json = await res.json().catch(() => ({ ok: false, code: "GROWTH_ERROR" }));
  return NextResponse.json(json, { status: res.status, headers: NO_STORE });
}
