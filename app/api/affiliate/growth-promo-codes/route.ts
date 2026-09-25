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

function internalHeaders(secret: string): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-hc-ecosystem-internal-secret": secret,
    Authorization: `Bearer ${secret}`,
  };
}

async function sessionAffiliate() {
  const session = await auth();
  if (!session?.user?.email) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE }) };
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { affiliate: { select: { id: true, parentAffiliateId: true, status: true } } },
  });
  if (!user?.affiliate) {
    return { error: NextResponse.json({ error: "Affiliate account not found" }, { status: 404, headers: NO_STORE }) };
  }
  if (user.affiliate.status !== "ACTIVE") {
    return { error: NextResponse.json({ error: "Affiliate account is not active" }, { status: 403, headers: NO_STORE }) };
  }
  return { user, affiliate: user.affiliate };
}

export async function GET() {
  const authz = await sessionAffiliate();
  if ("error" in authz) return authz.error;
  const secret = growthSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, code: "GROWTH_SECRET_MISSING" }, { status: 503, headers: NO_STORE });
  }
  const url = new URL(`${growthBase()}/api/internal/ecosystem/affiliate/growth-promo-codes`);
  url.searchParams.set("centralUserId", authz.user.id);
  if (authz.affiliate.parentAffiliateId) url.searchParams.set("isSubAffiliate", "1");
  const res = await fetch(url, { headers: internalHeaders(secret), cache: "no-store" });
  const json = await res.json().catch(() => ({ ok: false, code: "GROWTH_ERROR" }));
  return NextResponse.json(json, { status: res.status, headers: NO_STORE });
}

export async function POST(req: Request) {
  const authz = await sessionAffiliate();
  if ("error" in authz) return authz.error;
  const secret = growthSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, code: "GROWTH_SECRET_MISSING" }, { status: 503, headers: NO_STORE });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400, headers: NO_STORE });
  }
  const res = await fetch(`${growthBase()}/api/internal/ecosystem/affiliate/growth-promo-codes`, {
    method: "POST",
    headers: internalHeaders(secret),
    cache: "no-store",
    body: JSON.stringify({
      centralUserId: authz.user.id,
      email: authz.user.email,
      displayName: authz.user.name ?? authz.user.username ?? null,
      code: body.code,
      discountSharePct: body.discountSharePct,
      isSubAffiliate: Boolean(authz.affiliate.parentAffiliateId),
      applicablePlanKeys: body.applicablePlanKeys,
      maxRedemptions: body.maxRedemptions ?? null,
      validUntil: body.validUntil ?? null,
    }),
  });
  const json = await res.json().catch(() => ({ ok: false, error: "Growth promo mislukt" }));
  return NextResponse.json(json, { status: res.status, headers: NO_STORE });
}
