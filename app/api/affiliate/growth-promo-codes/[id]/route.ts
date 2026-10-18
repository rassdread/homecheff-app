import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { growthServiceBase } from "@/lib/hc/preview-service-target";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

function growthBase() {
  return growthServiceBase();
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

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { affiliate: { select: { status: true } } },
  });
  if (!user?.affiliate || user.affiliate.status !== "ACTIVE") {
    return NextResponse.json({ error: "Affiliate account not found" }, { status: 404, headers: NO_STORE });
  }
  const secret = growthSecret();
  const base = growthBase();
  if (!secret) {
    return NextResponse.json({ ok: false, code: "GROWTH_SECRET_MISSING" }, { status: 503, headers: NO_STORE });
  }
  if (!base) {
    return NextResponse.json({ ok: false, code: "CONFIGURATION_ERROR" }, { status: 503, headers: NO_STORE });
  }
  const { id } = params;
  const res = await fetch(
    `${base}/api/internal/ecosystem/affiliate/growth-promo-codes/${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hc-ecosystem-internal-secret": secret,
        Authorization: `Bearer ${secret}`,
      },
      cache: "no-store",
      body: JSON.stringify({ centralUserId: user.id }),
    },
  );
  const json = await res.json().catch(() => ({ ok: false }));
  return NextResponse.json(json, { status: res.status, headers: NO_STORE });
}
