import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeAffiliateCompanyKvk,
  suggestOwnedCompanyIdentity,
} from "@/lib/affiliate/affiliate-company-kvk";

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
  if (!organizationId) {
    const hints = await loadOwnedCompanyHints(user.id);
    return NextResponse.json({ ...json, ...hints }, { status: res.status, headers: NO_STORE });
  }
  return NextResponse.json(json, { status: res.status, headers: NO_STORE });
}

async function loadOwnedCompanyHints(userId: string) {
  const [affiliate, profile] = await Promise.all([
    prisma.affiliate.findUnique({
      where: { userId },
      select: { status: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        Business: { select: { name: true, kvkNumber: true } },
        SellerProfile: { select: { companyName: true, kvk: true } },
      },
    }),
  ]);
  return {
    personalAffiliateActive: affiliate?.status === "ACTIVE",
    suggestedCompany: suggestOwnedCompanyIdentity({
      businessName: profile?.Business?.name,
      businessKvk: profile?.Business?.kvkNumber,
      sellerCompanyName: profile?.SellerProfile?.companyName,
      sellerKvk: profile?.SellerProfile?.kvk,
    }),
  };
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

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "CREATE_ORG");
  if (action === "CREATE_ORG" || action === "UPDATE_COMPANY_DETAILS") {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });
    if (affiliate?.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, code: "PERSONAL_AFFILIATE_REQUIRED" },
        { status: 403, headers: NO_STORE },
      );
    }
    const kvkNumber = normalizeAffiliateCompanyKvk(body.kvkNumber);
    if (!kvkNumber) {
      const raw = typeof body.kvkNumber === "string" ? body.kvkNumber.trim() : "";
      return NextResponse.json(
        { ok: false, code: raw ? "KVK_INVALID_FORMAT" : "KVK_REQUIRED" },
        { status: 422, headers: NO_STORE },
      );
    }
    body.kvkNumber = kvkNumber;
    if (action === "CREATE_ORG") body.isCertificationOnly = false;
  }
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
